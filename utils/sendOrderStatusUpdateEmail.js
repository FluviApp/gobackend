import resend from '../libs/resend.js';

const statusMessages = {
    pendiente: 'Hemos recibido tu pedido y lo revisaremos pronto.',
    confirmado: '¡Tu pedido ha sido confirmado! Pronto comenzaremos a prepararlo.',
    preparando: '🛠️ Estamos preparando tu pedido con cuidado.',
    en_camino: '🚚 ¡Tu pedido está en camino! Prepárate para recibirlo.',
    entregado: '✅ Tu pedido ha sido entregado. ¡Gracias por confiar en Fluvi!',
    retrasado: '⏳ Tu pedido se ha retrasado un poco. Agradecemos tu paciencia.',
    devuelto: '↩️ Tu pedido ha sido devuelto. Revisa los detalles o contáctanos si fue un error.',
    cancelado: '❌ Tu pedido fue cancelado. Puedes hacer uno nuevo cuando quieras.'
};

export const sendOrderStatusUpdateEmail = async ({ name, email, status }) => {
    try {
        const message = statusMessages[status] || 'Tu pedido ha cambiado de estado.';

        const response = await resend.emails.send({
            from: 'Fluvi <hola@fluvi.cl>',
            to: email,
            subject: `📦 Estado actualizado: ${status.replace('_', ' ').toUpperCase()}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: auto; background: #f4f4f4; border-radius: 12px;">
                    <h2 style="color: #1e90ff;">Hola ${name || 'amig@'} 👋</h2>
                    <p>${message}</p>

                    <div style="margin: 24px 0;">
                        <a href="https://fluvi.cl" style="background-color: #1e90ff; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px;">Ver mi pedido</a>
                    </div>

                    <p style="font-size: 12px; color: #777;">Este correo es solo informativo. No respondas a esta dirección.</p>
                </div>
            `
        });

        console.log(`📬 Email enviado: estado actualizado a "${status}"`);
        return true;
    } catch (error) {
        console.error('❌ Error al enviar actualización de estado:', error);
        return false;
    }
};
