import Order from '../../models/Orders.js';

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
                        deliveryDate: { $gte: todayStart, $lte: todayEnd } // hoy: todos los estados
                    },
                    {
                        deliveryDate: yesterday,
                        status: { $in: nonFinalStatuses } // ayer: solo si siguen activos
                    },
                    {
                        deliveryDate: tomorrow,
                        status: { $in: nonFinalStatuses } // mañana: solo si siguen activos
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
            const updated = await Order.findByIdAndUpdate(orderId, updateData, {
                new: true,
                runValidators: true,
            });

            return updated;
        } catch (error) {
            console.error('❌ Error en updateOrderById:', error);
            throw error;
        }
    }
}
