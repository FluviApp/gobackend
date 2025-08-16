import getResendClient from '../libs/resend.js';

export const sendOrderConfirmationEmail = async ({ name, email, deliveryDate, deliverySchedule, password }) => {
    try {
        console.log('📨 Enviando correo de confirmación...');
        console.log('👤 Cliente:', { name, email });
        console.log('📅 Fecha de entrega (deliveryDate):', deliveryDate);
        console.log('🕒 Hora de entrega (deliverySchedule.hour):', deliverySchedule?.hour);
        if (password) console.log('🔐 Contraseña generada incluida en el correo.');

        const resend = getResendClient();

        // Solo FECHA desde deliveryDate
        const formattedDate = deliveryDate
            ? new Date(deliveryDate).toLocaleDateString('es-CL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            })
            : null;

        // HORA desde deliverySchedule.hour (p. ej. "16:00")
        const formattedHour = deliverySchedule?.hour || null;

        const fechaHoraTexto = formattedDate
            ? `${formattedDate}${formattedHour ? ' — ' + formattedHour : ''}`
            : null;

        // Texto plano
        const lines = [
            `🙌 ¡Gracias por tu pedido, ${name || 'amig@'}!`,
            '',
            'Hemos recibido tu pedido correctamente y lo estamos preparando con mucho cariño.',
            '',
            fechaHoraTexto
                ? `🕒 Entrega programada para: ${fechaHoraTexto}`
                : '🚚 Te notificaremos pronto cuando tu pedido esté en camino.',
            '',
            ...(password ? [
                '🔐 Se ha creado una cuenta automáticamente con estos datos:',
                `Correo: ${email}`,
                `Contraseña: ${password}`,
                '',
                'Puedes iniciar sesión más adelante para revisar tus pedidos.'
            ] : []),
            '',
            'Gracias por confiar en Fluvi 💧',
            '',
            'Este correo fue generado automáticamente. No respondas a esta dirección.',
        ];

        // HTML estilizado
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #fefefe; border-radius: 12px; padding: 24px; border: 1px solid #eee;">
                <h2 style="color: #0099FF;">🎉 ¡Gracias por tu pedido, ${name || 'amig@'}!</h2>
                <p style="font-size: 16px; color: #333;">Hemos recibido tu pedido y lo estamos preparando con mucho cariño.</p>

                ${fechaHoraTexto
                ? `<p style="font-size: 16px; color: #333;">🕒 Entrega estimada: <strong>${fechaHoraTexto}</strong></p>`
                : `<p style="font-size: 16px; color: #333;">🚚 Te notificaremos cuando esté en camino.</p>`}

                ${password ? `
                    <div style="margin-top: 24px; background: #f1faff; padding: 16px; border-radius: 8px;">
                        <p style="font-size: 16px; color: #333;">✨ También hemos creado una cuenta para ti en Fluvi:</p>
                        <p style="font-size: 16px;"><strong>Correo:</strong> ${email}<br /><strong>Contraseña:</strong> ${password}</p>
                        <p style="font-size: 14px; color: #555;">Puedes cambiar tu contraseña cuando lo desees desde tu perfil.</p>
                    </div>
                ` : ''}

                <p style="font-size: 14px; color: #777;">Gracias por confiar en Fluvi 💧</p>
                <p style="font-size: 12px; color: #aaa;">Este correo fue generado automáticamente. No respondas a esta dirección.</p>
            </div>
        `;

        const response = await resend.emails.send({
            from: 'Fluvi <hola@fluvi.cl>',
            to: email,
            subject: '🧾 ¡Pedido recibido en Fluvi!',
            text: lines.join('\n'),
            html,
        });

        console.log('📧 Confirmación de pedido enviada:', response?.id || response);
        return true;
    } catch (error) {
        console.error('❌ Error al enviar confirmación de pedido:', error);
        return false;
    }
};
