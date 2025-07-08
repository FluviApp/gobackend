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

    const productList = products
        .map(
            (p) =>
                `<li><strong>${p.name}</strong> x${p.quantity} - $${p.totalPrice.toLocaleString()}</li>`
        )
        .join('');

    const html = `
        <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: auto; background: #f9f9f9; border-radius: 12px;">
            <h2 style="color: #1e90ff;">🛒 Nuevo pedido recibido</h2>
            <p><strong>Pedido:</strong> #${_id}</p>
            <p><strong>Cliente:</strong> ${customer?.name || 'N/A'}</p>
            <p><strong>Email:</strong> ${customer?.email || 'N/A'}</p>
            <p><strong>Teléfono:</strong> ${customer?.phone || 'N/A'}</p>
            <p><strong>Dirección:</strong> ${customer?.address || 'N/A'}</p>
            <p><strong>Tipo de entrega:</strong> ${deliveryType}</p>
            <p><strong>Fecha de entrega:</strong> ${formattedDate}</p>
            <p><strong>Método de pago:</strong> ${paymentMethod}</p>
            <p><strong>Origen:</strong> ${origin}</p>
            <hr />
            <p><strong>Productos:</strong></p>
            <ul>${productList}</ul>
            <hr />
            <p><strong>Total:</strong> $${finalPrice || price}</p>
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
