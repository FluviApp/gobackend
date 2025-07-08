import connectMongoDB from '../../libs/mongoose.js';
import Order from '../../models/Orders.js';
import User from '../../models/User.js';
import { sendOrderConfirmationEmail } from '../../utils/sendOrderConfirmationEmail.js';
import { sendAdminNewOrderNotification } from '../../utils/sendAdminNewOrderNotification.js';

export default class ClientOrderService {
    constructor() {
        connectMongoDB();
    }

    getNextWeekdayDate(dayName, hourString) {
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = new Date();
        const todayDay = today.getDay();
        const targetDay = daysOfWeek.indexOf(dayName.toLowerCase());

        let daysUntilTarget = targetDay - todayDay;
        if (daysUntilTarget < 0 || (daysUntilTarget === 0 && this.isPastHour(hourString))) {
            daysUntilTarget += 7;
        }

        const targetDate = new Date();
        targetDate.setDate(today.getDate() + daysUntilTarget);

        const [hour, minute] = hourString.split(':').map(Number);
        targetDate.setHours(hour, minute, 0, 0);

        return targetDate;
    }


    isPastHour(hourString) {
        const now = new Date();
        const [hour, minute] = hourString.split(':').map(Number);
        return now.getHours() > hour || (now.getHours() === hour && now.getMinutes() > minute);
    }


    createOrder = async (data) => {
        try {
            if (data.deliverySchedule?.day && data.deliverySchedule?.hour) {
                const deliveryDate = this.getNextWeekdayDate(data.deliverySchedule.day, data.deliverySchedule.hour);
                data.deliveryDate = deliveryDate;
            }

            const newOrder = new Order(data);
            await newOrder.save();
            // 1️⃣ Enviar confirmación al cliente
            const { email, name } = newOrder.customer || {};
            if (email) {
                await sendOrderConfirmationEmail({
                    email,
                    name,
                    deliveryDate: newOrder.deliveryDate
                });
            }

            // 2️⃣ Buscar al admin de ese store y notificarlo
            const admin = await User.findOne({ storeId: data.storeId, role: 'admin' });
            if (admin?.mail) {
                await sendAdminNewOrderNotification({ email: admin.mail, order: newOrder });
            }
            return {
                success: true,
                message: 'Pedido creado exitosamente',
                data: newOrder,
            };
        } catch (error) {
            console.error('❌ ClientOrderService - error en createOrder:', error);
            return {
                success: false,
                message: 'No se pudo crear el pedido',
            };
        }
    };


    getPendingOrdersByEmail = async (email) => {
        try {
            const excludedStatuses = ['entregado', 'devuelto', 'cancelado'];

            const orders = await Order.find({
                'customer.email': email,
                status: { $nin: excludedStatuses },
            }).sort({ createdAt: -1 });

            return {
                success: true,
                data: orders,
            };
        } catch (error) {
            console.error('❌ ClientOrderService - error en getPendingOrdersByEmail:', error);
            return {
                success: false,
                message: 'No se pudieron obtener los pedidos pendientes',
            };
        }
    };

    getOrdersByClientId = async (clientId) => {
        try {
            const orders = await Order.find({ 'customer.id': clientId })
                .sort({ createdAt: -1 }) // más recientes primero
                .limit(10);

            return {
                success: true,
                data: orders,
            };
        } catch (error) {
            console.error('❌ ClientOrderService - error en getOrdersByClientId:', error);
            return {
                success: false,
                message: 'No se pudieron obtener los pedidos del cliente',
            };
        }
    };

}
