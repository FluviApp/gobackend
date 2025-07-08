import { Resend } from 'resend';

const resend = new Resend('huhbñqvekjb '); // ⚠️ asegúrate de tener esto en .env

export const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 0;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          
          <h2 style="color: #333333; font-size: 28px; font-weight: 700; margin-top: 0;">¡Bienvenido a la familia!</h2>
          
          <p style="color: #555555; font-size: 16px; line-height: 1.6;">
            Hola <strong>${name}</strong>,<br/>
            Nos alegra muchísimo tenerte con nosotros. A partir de ahora, podrás acceder a beneficios exclusivos y descubrir lo mejor de nuestros productos.
          </p>

          <p style="color: #555555; font-size: 16px; line-height: 1.6;">
            Recuerda que puedes acceder con tu correo electrónico y la contraseña que registraste. Si tienes alguna duda, no dudes en escribirnos.
          </p>

          <div style="text-align: center; margin-top: 40px;">
            <a href="https://tusitio.com/login" style="background-color: #ff385c; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; display: inline-block;">
              Ir al sitio
            </a>
          </div>

          <p style="color: #999999; font-size: 14px; text-align: center; margin-top: 40px;">
            Este correo es solo informativo, por favor no respondas directamente.
          </p>
        </div>
    </div>`;

  return await resend.emails.send({
    from: 'Soporte <soporte@tudominio.com>',
    to: email,
    subject: '¡Bienvenido a la comunidad!',
    html,
  });
};
