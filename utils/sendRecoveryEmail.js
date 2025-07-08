import { Resend } from 'resend';

const resend = new Resend('process.env.RESEND_API_KEY'); // ⚠️ asegúrate de tener esto en .env

export const sendPasswordRecoveryEmail = async (email, name, tempPassword) => {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 12px; background: #f9f9f9;">
        <h2 style="color: #111">Hola ${name},</h2>
        <p style="font-size: 16px; color: #444">
            Recibimos una solicitud para restablecer tu contraseña. Aquí tienes una contraseña temporal:
        </p>
        <div style="font-size: 20px; font-weight: bold; margin: 16px 0; color: #222; background: #eee; padding: 10px; border-radius: 6px;">
            ${tempPassword}
        </div>
        <p style="font-size: 14px; color: #666">
            Puedes usar esta contraseña para iniciar sesión y luego cambiarla desde tu perfil.
        </p>
        <hr style="margin: 24px 0" />
        <p style="font-size: 12px; color: #aaa">
            Si no solicitaste esto, puedes ignorar este correo.
        </p>
    </div>`;

    return await resend.emails.send({
        from: 'Soporte <soporte@tudominio.com>',
        to: email,
        subject: 'Recupera tu contraseña',
        html,
    });
};
