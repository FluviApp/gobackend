import getResendClient from '../libs/resend.js';

export const sendAdminNewOrderNotification = async ({ email, order }) => {
    const resend = getResendClient();

    const {
        _id,
        customer,
        deliveryDate,
        deliveryType,
        paymentMethod,
        status,
        products,
        price,
        finalPrice,
        origin
    } = order;

    const formattedDate = deliveryDate
        ? new Date(deliveryDate).toLocaleString('es-CL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
        })
        : 'No programada';

    const productList = (products || [])
        .map((p) =>
            `<li><strong>${p.name}</strong> x${p.quantity} — $${p.totalPrice?.toLocaleString('es-CL')}</li>`
        )
        .join('');

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #eee;">
            <h2 style="color: #0099FF; margin-bottom: 16px;">🚨 Nuevo pedido recibido</h2>

            <p><strong>N° Pedido:</strong> ${_id}</p>
            <p><strong>Cliente:</strong> ${customer?.name || 'No informado'}</p>
            <p><strong>Email:</strong> ${customer?.email || 'No informado'}</p>
            <p><strong>Teléfono:</strong> ${customer?.phone || 'No informado'}</p>
            <p><strong>Dirección:</strong> ${customer?.address || 'No informado'}</p>

            <p><strong>Tipo de entrega:</strong> ${deliveryType === 'delivery' ? '🚚 Delivery' : '🏃 Retiro'}</p>
            <p><strong>Fecha de entrega:</strong> ${formattedDate}</p>
            <p><strong>Método de pago:</strong> ${paymentMethod || 'No informado'}</p>
            <p><strong>Origen:</strong> ${origin || 'App'}</p>

            <hr style="margin: 24px 0;" />

            <h3 style="color: #333;">🧾 Productos</h3>
            <ul style="padding-left: 20px; margin-bottom: 24px;">
                ${productList || '<li>No se informaron productos</li>'}
            </ul>

            <p style="font-size: 18px; font-weight: bold; color: #0099FF;">
                Total: $${(finalPrice || price)?.toLocaleString('es-CL')}
            </p>

            <div style="margin-top: 32px;">
                <a href="https://fluvi.cl/admin" style="display: inline-block; background-color: #0099FF; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">Abrir panel de pedidos</a>
            </div>

            <p style="font-size: 12px; color: #999; margin-top: 32px;">
                Este correo fue generado automáticamente. No respondas a esta dirección.
            </p>
        </div>
    `;

    try {
        const response = await resend.emails.send({
            from: 'Fluvi Notificaciones <hola@fluvi.cl>',
            to: email,
            subject: '🛒 Nuevo pedido recibido en Fluvi',
            html
        });

        console.log('📧 Notificación al admin enviada:', response.id);
        return true;
    } catch (error) {
        console.error('❌ Error al enviar correo al admin:', error);
        return false;
    }
};
