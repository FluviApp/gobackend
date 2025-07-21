import getResendClient from '../libs/resend.js'; // ✅ FIX

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
        const resend = getResendClient(); // ✅ FIX
        const message = statusMessages[status] || 'Tu pedido ha cambiado de estado.';

        const response = await resend.emails.send({
            from: 'Fluvi <hola@fluvi.cl>',
            to: email,
            subject: `📦 Estado actualizado: ${status.replace('_', ' ').toUpperCase()}`,
            html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #eee;">
    <h2 style="color: #0099FF;">📦 Tu pedido ha cambiado de estado</h2>
    <p style="font-size: 16px; color: #333;">Hola ${name || 'amig@'} 👋</p>
    <p style="font-size: 16px; color: #333;">${message}</p>

    <div style="margin: 24px 0;">
      <a href="https://fluvi.cl" style="background-color: #0099FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Ver mi pedido</a>
    </div>

    <p style="font-size: 14px; color: #777;">Gracias por confiar en Fluvi 💧</p>
    <p style="font-size: 12px; color: #aaa;">Este correo fue generado automáticamente. No respondas a esta dirección.</p>
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
