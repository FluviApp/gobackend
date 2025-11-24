import connectMongoDB from '../../libs/mongoose.js';
import Orders from '../../models/Orders.js';
import User from '../../models/User.js';
import Notifications from '../../models/Notifications.js';
import { sendOrderStatusUpdateEmail } from '../../utils/sendOrderStatusUpdateEmail.js';
import { sendPushNotification } from '../../utils/sendPushNotification.js';

// ⏰ Zona horaria Chile con dayjs
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(utc);
dayjs.extend(timezone);
const TZ = 'America/Santiago';
dayjs.tz.setDefault(TZ);

// (opcional pero recomendado) Fijar TZ del proceso si tu hosting lo respeta
// process.env.TZ = TZ;

export default class StoreOrdersService {
    constructor() {
        connectMongoDB();
    }

    getAllOrders = async ({
        storeId,
        page = 1,
        limit = 50,
        startDate,
        endDate,
        status,
        transferPay,
        deliveryType, // 👈 nuevo param
    }) => {
        console.log('🧪 startDate:', startDate);
        console.log('🧪 endDate:', endDate);
        console.log('🧪 storeId:', storeId);
        console.log('🧪 status:', status);
        console.log('🧪 transferPay:', transferPay);
        console.log('🧪 deliveryType:', deliveryType); // 👈 log adicional

        try {
            if (!storeId) {
                return { success: false, message: 'storeId es requerido' };
            }

            const query = { storeId };

            // ⏰ Filtro por rango de fechas (deliveryDate) en hora de Chile
            if (startDate && endDate) {
                const start = dayjs.tz(startDate, TZ).startOf('day').toDate();
                const end = dayjs.tz(endDate, TZ).endOf('day').toDate();
                query.deliveryDate = { $gte: start, $lte: end };
            }

            // Filtro por estado
            if (status) {
                query.status = status;
            }

            // Filtro por transferPay (acepta 'true'/'false' o boolean)
            if (typeof transferPay !== 'undefined' && transferPay !== null && transferPay !== '') {
                const tf = (typeof transferPay === 'string') ? transferPay === 'true' : !!transferPay;
                query.transferPay = tf;
            }

            // ✅ Filtro por tipo de entrega (acepta ambas convenciones)
            if (deliveryType) {
                const dt = String(deliveryType).toLowerCase();
                if (dt === 'domicilio' || dt === 'delivery') {
                    query.deliveryType = { $in: ['domicilio', 'delivery'] };
                } else if (dt === 'local' || dt === 'retiro' || dt === 'pickup' || dt === 'mostrador') {
                    query.deliveryType = { $in: ['local', 'retiro', 'pickup', 'mostrador'] };
                }
            }

            const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                sort: { deliveryDate: -1, 'deliverySchedule.hour': -1 },
            };

            const result = await Orders.paginate(query, options);

            return {
                success: true,
                message: 'Pedidos obtenidos correctamente',
                data: result,
            };
        } catch (error) {
            console.error('❌ Error al obtener pedidos:', error);
            return {
                success: false,
                message: 'Error al obtener pedidos',
            };
        }
    };


    // ⏰ Helpers con TZ Chile
    getNextWeekdayDate(dayName, hourString) {
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        const now = dayjs().tz(TZ);
        const todayDay = now.day(); // 0-6 (domingo=0)
        const targetDay = daysOfWeek.indexOf(dayName.toLowerCase());

        let diff = (targetDay - todayDay + 7) % 7;

        const [hour, minute] = hourString.split(':').map(Number);
        const todayAtHour = now.hour(hour).minute(minute).second(0).millisecond(0);

        // Si es hoy y la hora ya pasó en Chile, manda para la próxima semana
        if (diff === 0 && now.isAfter(todayAtHour)) diff = 7;

        const target = now.add(diff, 'day').hour(hour).minute(minute).second(0).millisecond(0);
        return target.toDate(); // Se guarda en UTC, pero representa esa hora local de Chile
    }

    isPastHour(hourString) {
        const now = dayjs().tz(TZ);
        const [hour, minute] = hourString.split(':').map(Number);
        const atHour = now.hour(hour).minute(minute).second(0).millisecond(0);
        return now.isAfter(atHour);
    }

    createOrder = async (data) => {
        try {
            // 🔄 Normalización de deliveryType
            if (data?.deliveryType) {
                const raw = String(data.deliveryType).toLowerCase();
                if (raw === 'delivery' || raw === 'domicilio') {
                    data.deliveryType = 'domicilio';
                } else if (['local', 'retiro', 'pickup', 'mostrador'].includes(raw)) {
                    data.deliveryType = 'local';
                }
            }
            // ⏰ Calcular deliveryDate en Chile si no viene
            if ((!data.deliveryDate || data.deliveryDate === '') && data.deliverySchedule?.day && data.deliverySchedule?.hour) {
                const deliveryDate = this.getNextWeekdayDate(data.deliverySchedule.day, data.deliverySchedule.hour);
                data.deliveryDate = deliveryDate;
            } else if (data.deliveryDate) {
                // Si te llega un string de fecha (ej. YYYY-MM-DD), normalízalo a Chile fin/inicio según convenga.
                // Aquí asumimos que viene con fecha-hora ya correcta; si viene solo fecha:
                const parsed = dayjs.tz(data.deliveryDate, TZ);
                if (parsed.isValid()) data.deliveryDate = parsed.toDate();
            }

            // 👤 Completar datos de cliente
            if (data.customer?.id) {
                const rawId = String(data.customer.id).trim();
                console.log(`${rawId}   ------ id del usuario`);

                let user = null;

                try {
                    user = await User.findById(rawId).lean();
                } catch (e) {
                    console.warn('⚠️ findById lanzó error:', e.message);
                }

                if (!user && data.customer?.email) {
                    try {
                        user = await User.findOne({ email: data.customer.email }).lean();
                        if (user) console.log('🔎 Encontrado por email:', user.email);
                    } catch (e) {
                        console.warn('⚠️ findOne por email lanzó error:', e.message);
                    }
                }

                if (user) {
                    console.log(`${user.email}   ------ correo del usuario`);
                    data.customer = {
                        id: user._id,
                        name: user.name,
                        email: user.email ?? '',
                        phone: user.phone,
                        address: user.address,
                        lat: user.lat,
                        lon: user.lon,
                        notificationToken: user.token || '',
                    };
                } else {
                    console.warn('⚠️ No se encontró User por id/email; se conserva lo enviado desde el front');
                    data.customer = {
                        id: rawId,
                        name: data.customer.name ?? '',
                        email: data.customer.email ?? '',
                        phone: data.customer.phone ?? '',
                        address: data.customer.address ?? '',
                        lat: data.customer.lat,
                        lon: data.customer.lon,
                        notificationToken: data.customer.notificationToken ?? '',
                    };
                }
            }

            const newOrder = new Orders(data);
            const saved = await newOrder.save();

            return {
                success: true,
                message: 'Pedido creado correctamente',
                data: saved
            };
        } catch (error) {
            console.error('❌ Error al crear pedido:', error);
            return {
                success: false,
                message: error.message || 'Error al crear pedido'
            };
        }
    };

    updateOrder = async (id, data) => {
        try {
            console.log('🧪 Ejecutando updateOrder con ID:', id);
            console.log('🧪 Datos recibidos para actualizar:', data);

            // 1️⃣ Obtener el pedido actual
            const existingOrder = await Orders.findById(id);
            if (!existingOrder) {
                console.warn('⚠️ Pedido no encontrado');
                return { success: false, message: 'Pedido no encontrado' };
            }

            const previousStatus = existingOrder.status;
            const newStatus = data.status;
            const previousPaymentMethod = existingOrder.paymentMethod;
            const newPaymentMethod = data.paymentMethod;

            console.log(`🔄 Estado anterior: ${previousStatus} → Nuevo: ${newStatus}`);
            console.log(`💳 Método de pago anterior: ${previousPaymentMethod} → Nuevo: ${newPaymentMethod}`);

            // ⏰ Normaliza deliveryDate si viene (a TZ Chile)
            if (typeof data.deliveryDate !== 'undefined' && data.deliveryDate) {
                const parsed = dayjs.tz(data.deliveryDate, TZ);
                if (parsed.isValid()) data.deliveryDate = parsed.toDate();
            }

            // 2️⃣ Lógica transferPay (sin cambios de fondo)
            console.log('🔍 Evaluando el campo transferPay...');
            if (typeof data.transferPay !== 'undefined') {
                console.log('🔧 transferPay recibido explícitamente, se mantiene:', data.transferPay);
            } else {
                const finalPaymentMethod = data.paymentMethod || existingOrder.paymentMethod;
                if (newStatus === 'entregado' && finalPaymentMethod === 'transferencia') {
                    console.log('✅ Estado "entregado" y método de pago "transferencia", transferPay=false');
                    data.transferPay = false;
                } else {
                    console.log('❌ No entregado o método no transferencia, transferPay=true');
                    data.transferPay = true;
                }
            }
            console.log('📝 Datos después de la actualización de transferPay:', data);

            // 3️⃣ Actualizar
            const updated = await Orders.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });

            // 4️⃣ Notificaciones si cambió estado
            if (newStatus && newStatus !== previousStatus) {
                const { name, email, notificationToken } = updated.customer || {};
                const storeId = updated.storeId;

                console.log('👤 Cliente actualizado:', { name, email, notificationToken });

                if (email) {
                    try {
                        console.log('📨 Enviando correo de estado actualizado...');
                        await sendOrderStatusUpdateEmail({ name, email, status: newStatus });
                        console.log('✅ Correo enviado con éxito');
                    } catch (e) {
                        console.error('❌ Error al enviar el correo:', e);
                    }
                } else {
                    console.warn('⚠️ No se encontró email del cliente');
                }

                if (notificationToken) {
                    try {
                        console.log('📲 Enviando notificación push...');
                        const response = await fetch('https://exp.host/--/api/v2/push/send', {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Accept-Encoding': 'gzip, deflate',
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                to: notificationToken,
                                sound: 'default',
                                title: '📦 Estado actualizado',
                                body: `Tu pedido está ahora: ${newStatus.replace('_', ' ')}`,
                            }),
                        });
                        const result = await response.json();
                        console.log('✅ Notificación enviada:', result);
                    } catch (e) {
                        console.error('❌ Error al enviar notificación push:', e);
                    }
                } else {
                    console.warn('⚠️ No se encontró token de notificación del cliente');
                }

                if (storeId && email) {
                    try {
                        await Notifications.create({
                            storeId,
                            email,
                            title: `Tu pedido cambió a "${newStatus}"`,
                            body: `Hola ${name || 'cliente'}, tu pedido ahora está en estado: ${newStatus}`,
                            token: notificationToken || '',
                            url: '/pedidos-usuario',
                        });
                        console.log('📝 Notificación guardada en base de datos');
                    } catch (e) {
                        console.error('❌ Error al guardar notificación en DB:', e);
                    }
                }
            }

            return {
                success: true,
                message: 'Pedido actualizado correctamente',
                data: updated
            };
        } catch (error) {
            console.error('❌ Error al actualizar pedido:', error);
            return {
                success: false,
                message: 'Error al actualizar pedido'
            };
        }
    };

    deleteOrder = async (id) => {
        try {
            const deleted = await Orders.findByIdAndDelete(id);
            if (!deleted) {
                return { success: false, message: 'Pedido no encontrado' };
            }
            return {
                success: true,
                message: 'Pedido eliminado correctamente'
            };
        } catch (error) {
            console.error('❌ Error al eliminar pedido:', error);
            return {
                success: false,
                message: 'Error al eliminar pedido'
            };
        }
    };

    // ⏰ Pedidos pendientes hasta hoy (fin de día en Chile)
    getPendingOrders = async ({ storeId }) => {
        const estadosExcluidos = ['entregado']; // Solo excluimos 'entregado'
        try {
            const endOfTodayChile = dayjs().tz(TZ).endOf('day').toDate();

            const query = {
                storeId,
                deliveryType: 'domicilio',
                deliveryDate: { $lte: endOfTodayChile },
                status: { $nin: estadosExcluidos },
            };

            console.log("🔍 Consulta que se va a ejecutar:", query);

            const result = await Orders.find(query).sort({ deliveryDate: 1 });

            console.log('🏷️ Resultados obtenidos:', result);

            return {
                success: true,
                message: 'Pedidos hasta hoy obtenidos correctamente',
                data: result,
            };
        } catch (error) {
            console.error('❌ Error al obtener pedidos hasta hoy:', error);
            return {
                success: false,
                message: 'Error al obtener pedidos hasta hoy',
            };
        }
    };
}
