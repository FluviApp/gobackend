import connectMongoDB from '../../libs/mongoose.js';
import Order from '../../models/Orders.js';
import Clients from '../../models/Clients.js';
import Dealers from '../../models/Dealers.js';
import User from '../../models/User.js';
import crypto from 'crypto';
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

    async findOrCreateClient({ name, email, password, storeId }) {
        let user = await Clients.findOne({ email });

        if (!user) {
            const generatedPassword = password || 'fluvi-' + crypto.randomInt(1000, 9999);

            user = new Clients({
                name,
                email,
                password: generatedPassword,
                storeId,
            });

            await user.save();
            console.log('👤 Usuario creado automáticamente:', user._id);

            return { user, wasCreated: true, generatedPassword };
        } else {
            console.log('✅ Usuario ya existía:', user._id);
            return { user, wasCreated: false };
        }
    }




    createOrder = async (data) => {
        try {
            // 📅 Calcular fecha de entrega si se indica horario
            if (data.deliverySchedule?.day && data.deliverySchedule?.hour) {
                const deliveryDate = this.getNextWeekdayDate(data.deliverySchedule.day, data.deliverySchedule.hour);
                data.deliveryDate = deliveryDate;
            }

            // 👤 Buscar o crear el usuario
            const { user, wasCreated, generatedPassword } = await this.findOrCreateClient({
                name: data.customer.name,
                email: data.customer.email,
                password: data.customer.password,
                storeId: data.storeId,
            });

            // 🔗 Asociar el ID del usuario al pedido
            data.customer.id = user._id;

            // 🚚 Asignar automáticamente un dealer por zona (si hay zoneId)
            if (data.zoneId) {
                const dealer = await Dealers.findOne({ zoneId: data.zoneId }).lean();

                if (dealer) {
                    console.log('🚚 Dealer asignado automáticamente:', dealer.name);
                    data.deliveryPerson = {
                        id: dealer._id.toString(),
                        name: dealer.name,
                    };
                } else {
                    console.log('⚠️ No se encontró dealer para zoneId:', data.zoneId);
                }
            }

            // 🧾 Crear el pedido
            const newOrder = new Order(data);
            await newOrder.save();

            // 📧 Enviar correo de confirmación (con contraseña si fue creado)
            const { email, name } = newOrder.customer || {};
            if (email) {
                await sendOrderConfirmationEmail({
                    email,
                    name,
                    deliveryDate: newOrder.deliveryDate,
                    password: wasCreated ? generatedPassword : undefined,
                });
            }

            // 🔔 Notificar al admin de ese store
            const admin = await User.findOne({ storeId: data.storeId, role: 'admin' });
            console.log(admin?.admin?.mail)
            console.log('📧 Notificando al admin:', admin.mail);
            if (admin?.mail) {
                await sendAdminNewOrderNotification({ email: admin.mail, order: newOrder });
            }

            // ✅ Retornar también el usuario para autologin
            return {
                success: true,
                message: 'Pedido creado exitosamente',
                data: {
                    order: newOrder,
                    user,
                },
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
