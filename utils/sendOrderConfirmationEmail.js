import getResendClient from '../libs/resend.js'; // ✅ Usamos la función que devuelve la instancia

export const sendOrderConfirmationEmail = async ({ name, email, deliveryDate }) => {
    try {
        console.log('📨 Enviando correo de confirmación...');
        console.log('👤 Cliente:', { name, email });
        console.log('📅 Fecha de entrega:', deliveryDate);

        const resend = getResendClient(); // ✅ Instancia del cliente correctamente creada

        console.log('🔍 Verificando estructura de resend:');
        console.log('resend:', resend);
        console.log('resend.emails:', resend.emails);
        console.log('typeof resend.emails:', typeof resend.emails);
        console.log('typeof resend.emails.send:', typeof resend?.emails?.send);

        const formattedDate = deliveryDate
            ? new Date(deliveryDate).toLocaleString('es-CL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
            })
            : null;

        const response = await resend.emails.send({
            from: 'Fluvi <hola@fluvi.cl>',
            to: email,
            subject: '🧾 ¡Pedido recibido en Fluvi!',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: auto; background: #f9f9f9; border-radius: 12px;">
                    <h2 style="color: #1e90ff;">🙌 ¡Gracias por tu pedido, ${name || 'amig@'}!</h2>
                    <p>Hemos recibido tu pedido correctamente y lo estamos preparando con mucho cariño.</p>

                    ${formattedDate
                    ? `<p>🕒 Entrega programada para: <strong>${formattedDate}</strong></p>`
                    : `<p>🚚 Te notificaremos pronto cuando tu pedido esté en camino.</p>`}

                    <div style="margin: 24px 0;">
                        <a href="https://fluvi.cl" style="background-color: #1e90ff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px;">Ver mi pedido</a>
                    </div>

                    <p>Gracias por confiar en Fluvi 💧</p>
                    <p style="font-size: 12px; color: #777;">Este correo fue generado automáticamente. No respondas a esta dirección.</p>
                </div>
            `,
        });

        console.log('📧 Confirmación de pedido enviada:', response?.id || response);
        return true;
    } catch (error) {
        console.error('❌ Error al enviar confirmación de pedido:', error);
        return false;
    }
};
