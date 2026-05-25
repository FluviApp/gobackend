import StoreEmails from '../../models/StoreEmails.js';
import Clients from '../../models/Clients.js';
import connectMongoDB from '../../libs/mongoose.js';
import getResendClient from '../../libs/resend.js';

export default class StoreEmailsService {
    constructor() {
        connectMongoDB();
    }

    getAllEmails = async ({ storeId, page = 1, limit = 10 }) => {
        try {
            const options = {
                page,
                limit,
                sort: { createdAt: -1 },
            };

            const result = await StoreEmails.paginate({ storeId }, options);

            return {
                success: true,
                message: 'Correos obtenidos correctamente',
                data: result,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener correos:', error);
            return {
                success: false,
                message: 'Error al obtener correos',
            };
        }
    };

    getEmailTemplate = (message, storeName = 'Fluvi') => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #fefefe; border-radius: 12px; padding: 24px; border: 1px solid #eee;">
                <h2 style="color: #0099FF; margin-top: 0;">📢 Notificación de ${storeName}</h2>

                <div style="font-size: 16px; color: #333; line-height: 1.6;">
                    ${message.split('\n').map(line => {
                        const trimmed = line.trim();
                        if (!trimmed) return '<p style="margin: 12px 0;">&nbsp;</p>';
                        return `<p style="margin: 12px 0; color: #333;">${trimmed}</p>`;
                    }).join('')}
                </div>

                <div style="margin-top: 24px; background: #f1faff; padding: 16px; border-radius: 8px;">
                    <p style="font-size: 14px; color: #0099FF; margin: 0;">✨ Gracias por confiar en ${storeName} 💧</p>
                </div>

                <p style="font-size: 12px; color: #aaa; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">
                    Este correo fue generado automáticamente. No respondas a esta dirección.
                </p>
            </div>
        `;
    };

    async sendCustomEmail({ storeId, recipientEmail, recipientName, subject, message }) {
        try {
            if (!storeId || !recipientEmail || !subject || !message) {
                return {
                    success: false,
                    message: 'StoreId, email del destinatario, asunto y mensaje son obligatorios',
                };
            }

            const emailRecord = await StoreEmails.create({
                storeId,
                recipientEmail: recipientEmail.trim(),
                recipientName: (recipientName || '').trim(),
                subject: subject.trim(),
                message: message.trim(),
                status: 'pending',
            });

            try {
                const resend = getResendClient();
                const html = this.getEmailTemplate(message.trim());

                const response = await resend.emails.send({
                    from: 'Fluvi <hola@fluvi.cl>',
                    to: recipientEmail.trim(),
                    subject: subject.trim(),
                    html,
                });

                if (response?.id) {
                    emailRecord.status = 'sent';
                    emailRecord.sentAt = new Date();
                    await emailRecord.save();

                    console.log('✅ Correo enviado exitosamente a:', recipientEmail);
                    return {
                        success: true,
                        message: 'Correo enviado exitosamente',
                        data: emailRecord,
                    };
                } else {
                    throw new Error('No se obtuvo ID de respuesta de Resend');
                }
            } catch (sendError) {
                emailRecord.status = 'failed';
                emailRecord.errorMessage = sendError.message || 'Error desconocido al enviar';
                await emailRecord.save();

                console.error('❌ Error al enviar correo:', sendError);
                return {
                    success: false,
                    message: sendError.message || 'Error al enviar el correo',
                    data: emailRecord,
                };
            }
        } catch (error) {
            console.error('❌ Servicio - Error al crear y enviar correo:', error);
            return {
                success: false,
                message: 'Error al enviar el correo',
            };
        }
    }

    async sendEmailToMultipleClients({ storeId, clientIds, subject, message }) {
        try {
            if (!storeId || !clientIds || clientIds.length === 0 || !subject || !message) {
                return {
                    success: false,
                    message: 'StoreId, clientes, asunto y mensaje son obligatorios',
                };
            }

            const clients = await Clients.find({
                _id: { $in: clientIds },
                storeId,
                email: { $exists: true, $ne: '' },
            });

            if (clients.length === 0) {
                return {
                    success: false,
                    message: 'No se encontraron clientes válidos',
                };
            }

            const results = {
                sent: 0,
                failed: 0,
                errors: [],
            };

            const resend = getResendClient();
            const html = this.getEmailTemplate(message.trim());

            for (const client of clients) {
                try {
                    const emailRecord = await StoreEmails.create({
                        storeId,
                        recipientEmail: client.email,
                        recipientName: client.name || '',
                        subject: subject.trim(),
                        message: message.trim(),
                        status: 'pending',
                    });

                    const response = await resend.emails.send({
                        from: 'Fluvi <hola@fluvi.cl>',
                        to: client.email,
                        subject: subject.trim(),
                        html,
                    });

                    if (response?.id) {
                        emailRecord.status = 'sent';
                        emailRecord.sentAt = new Date();
                        await emailRecord.save();
                        results.sent++;
                        console.log(`✅ Correo enviado a: ${client.email}`);
                    } else {
                        throw new Error('No se obtuvo ID de respuesta de Resend');
                    }
                } catch (clientError) {
                    results.failed++;
                    results.errors.push({
                        clientEmail: client.email,
                        error: clientError.message,
                    });
                    console.error(`❌ Error al enviar a ${client.email}:`, clientError.message);
                }
            }

            return {
                success: results.failed === 0,
                message: `Correos enviados: ${results.sent}/${clients.length}`,
                data: {
                    sent: results.sent,
                    failed: results.failed,
                    total: clients.length,
                    errors: results.errors,
                },
            };
        } catch (error) {
            console.error('❌ Servicio - Error al enviar correos múltiples:', error);
            return {
                success: false,
                message: 'Error al enviar los correos',
            };
        }
    }

    deleteEmail = async (id) => {
        try {
            const email = await StoreEmails.findByIdAndDelete(id);
            if (!email) return { success: false, message: 'Correo no encontrado' };

            return {
                success: true,
                message: 'Correo eliminado correctamente',
            };
        } catch (error) {
            console.error('❌ Servicio - Error al eliminar correo:', error);
            return {
                success: false,
                message: 'Error al eliminar el correo',
            };
        }
    };
}
