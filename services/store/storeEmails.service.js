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
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; }
                </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f5f7fa;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <!-- Header con gradiente -->
                    <div style="background: linear-gradient(135deg, #0099FF 0%, #0077CC 100%); border-radius: 12px 12px 0 0; padding: 40px 30px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">💧</div>
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">${storeName}</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Notificación importante</p>
                    </div>

                    <!-- Contenido principal -->
                    <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <!-- Mensaje principal -->
                        <div style="color: #2c3e50; line-height: 1.8; font-size: 16px;">
                            ${message.split('\n').map((line, idx) => {
                                const trimmed = line.trim();
                                if (!trimmed) return '<div style="height: 12px;"></div>';
                                return `<p style="margin: 0 0 16px 0; color: #2c3e50;">${trimmed}</p>`;
                            }).join('')}
                        </div>

                        <!-- Divisor -->
                        <div style="margin: 30px 0; border-top: 1px solid #e8eef7;"></div>

                        <!-- Footer -->
                        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center;">
                            <p style="font-size: 13px; color: #7f8fa3; margin: 0; line-height: 1.6;">
                                <strong>${storeName}</strong><br>
                                Este es un correo automático. Por favor no respondas a este mensaje.
                            </p>
                        </div>
                    </div>

                    <!-- Copyright -->
                    <div style="text-align: center; margin-top: 20px; padding: 0 30px;">
                        <p style="font-size: 12px; color: #95a5a6; margin: 0;">
                            © ${new Date().getFullYear()} ${storeName}. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </body>
            </html>
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
