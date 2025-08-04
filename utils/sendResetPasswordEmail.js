import getResendClient from '../libs/resend.js';

export const sendResetPasswordEmail = async (email, name = 'amig@', resetLink) => {
    try {
        const resend = getResendClient();

        const response = await resend.emails.send({
            from: 'Fluvi <hola@fluvi.cl>',
            to: email,
            subject: '🔐 Recupera tu contraseña en Fluvi',
            html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #eee;">
    <h2 style="color: #0099FF;">🔐 Restablece tu contraseña</h2>
    <p style="font-size: 16px; color: #333;">Hola ${name} 👋</p>
    <p style="font-size: 16px; color: #333;">
      Hemos recibido una solicitud para restablecer tu contraseña. Si no fuiste tú, puedes ignorar este mensaje.
    </p>

    <div style="margin: 24px 0;">
      <a href="${resetLink}" style="display: inline-block; background-color: #0099FF; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Restablecer contraseña
      </a>
    </div>

    <p style="font-size: 14px; color: #555;">
      El enlace es válido por 1 hora. Si necesitas uno nuevo, puedes solicitarlo nuevamente desde la app.
    </p>

    <p style="font-size: 14px; color: #777;">Gracias por confiar en Fluvi 💧</p>
    <p style="font-size: 12px; color: #aaa;">Este correo fue generado automáticamente. No respondas a esta dirección.</p>
  </div>
      `
        });

        console.log('📬 Correo de recuperación enviado:', response?.id || response);
        return true;
    } catch (error) {
        console.error('❌ Error al enviar correo de recuperación:', error);
        return false;
    }
};
