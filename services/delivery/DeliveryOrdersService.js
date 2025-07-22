import Order from '../../models/Orders.js';
import { sendOrderStatusUpdateEmail } from '../../utils/sendOrderStatusUpdateEmail.js';
import { sendPushNotification } from '../../utils/sendPushNotification.js';

export default class DeliveryOrdersService {
    getOrdersByDeliveryId = async (deliveryId) => {
        try {
            const orders = await Order.find({ 'deliveryPerson.id': deliveryId }).sort({ createdAt: -1 });
            return orders;
        } catch (error) {
            console.error('❌ Error en DeliveryOrdersService:', error);
            throw error;
        }
    }

    getActiveOrdersByDeliveryId = async (deliveryId) => {
        try {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const yesterday = new Date(todayStart);
            yesterday.setDate(todayStart.getDate() - 1);

            const tomorrow = new Date(todayStart);
            tomorrow.setDate(todayStart.getDate() + 1);

            const nonFinalStatuses = ['pendiente', 'confirmado', 'preparando', 'en_camino', 'retrasado'];

            const orders = await Order.find({
                'deliveryPerson.id': deliveryId,
                $or: [
                    {
                        deliveryDate: { $gte: todayStart, $lte: todayEnd }
                    },
                    {
                        deliveryDate: yesterday,
                        status: { $in: nonFinalStatuses }
                    },
                    {
                        deliveryDate: tomorrow,
                        status: { $in: nonFinalStatuses }
                    }
                ]
            }).sort({ deliveryDate: 1, 'deliverySchedule.hour': 1 });

            return orders;
        } catch (error) {
            console.error('❌ Error en getActiveOrdersByDeliveryId:', error);
            throw error;
        }
    }

    getFinalizedTodayByDeliveryId = async (deliveryId) => {
        try {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const finalizedStatuses = ['entregado', 'retrasado', 'devuelto', 'cancelado'];

            const orders = await Order.find({
                'deliveryPerson.id': deliveryId,
                status: { $in: finalizedStatuses },
                deliveryDate: { $gte: todayStart, $lte: todayEnd }
            }).sort({ deliveryDate: -1 });

            return orders;
        } catch (error) {
            console.error('❌ Error en getFinalizedTodayByDeliveryId:', error);
            throw error;
        }
    }

    updateOrderById = async (orderId, updateData) => {
        try {
            const existingOrder = await Order.findById(orderId);
            if (!existingOrder) throw new Error('Pedido no encontrado');

            const previousStatus = existingOrder.status;
            const newStatus = updateData.status;

            const updated = await Order.findByIdAndUpdate(orderId, updateData, {
                new: true,
                runValidators: true,
            });

            // 📧 Enviar correo y 📲 notificación si el estado cambió
            if (newStatus && newStatus !== previousStatus) {
                const { name, email, notificationToken } = updated.customer || {};

                // 📧 Correo
                if (email) {
                    try {
                        await sendOrderStatusUpdateEmail({ name, email, status: newStatus });
                        console.log('✅ Correo de actualización enviado');
                    } catch (e) {
                        console.error('❌ Error al enviar correo:', e);
                    }
                }

                // 📲 Notificación push
                if (notificationToken) {
                    try {
                        await sendPushNotification({ token: notificationToken, status: newStatus });
                        console.log('📲 Notificación push enviada');
                    } catch (e) {
                        console.error('❌ Error al enviar notificación push:', e);
                    }
                }
            }

            return updated;
        } catch (error) {
            console.error('❌ Error en updateOrderById:', error);
            throw error;
        }
    };
}
