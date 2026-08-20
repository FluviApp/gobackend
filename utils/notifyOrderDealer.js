import Dealers from '../models/Dealers.js';
import Stores from '../models/Stores.js';
import { sendExpoPush } from './sendExpoPush.js';

// 🚚 Notifica por push SOLO al repartidor ASIGNADO a este pedido (deliveryPerson.id),
// sin importar la tienda. La asignación viene de la zona del pedido (zone.dealerId).
// Sirve para cualquier vía de creación (app, web/pedido rápido, admin, POS).
export const notifyOrderDealer = async (order) => {
    try {
        if (!order || order.deliveryType !== 'domicilio') return;

        const dealerId = order.deliveryPerson?.id;
        if (!dealerId) return; // sin repartidor asignado → no se notifica a nadie

        const dealer = await Dealers.findById(dealerId, { pushTokens: 1 }).lean();
        const tokens = dealer?.pushTokens || [];
        if (!tokens.length) return; // el repartidor asignado no tiene sesión activa

        const store = await Stores.findById(order.storeId, { name: 1 }).lean().catch(() => null);
        const addr = order.customer?.address ? ` · ${order.customer.address}` : '';

        await sendExpoPush({
            tokens,
            title: '🚚 Nuevo pedido',
            body: `Nuevo pedido en ${store?.name || 'tu tienda'}${addr}`,
            data: { type: 'new_order', orderId: String(order._id), storeId: String(order.storeId) },
        });
    } catch (e) {
        console.error('❌ Error notificando push al repartidor asignado:', e);
    }
};

export default notifyOrderDealer;
