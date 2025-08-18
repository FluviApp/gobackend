import connectMongoDB from '../../libs/mongoose.js';
import Order from '../../models/Orders.js';
import Clients from '../../models/Clients.js';
import Zones from '../../models/Zones.js';
import Dealers from '../../models/Dealers.js';
import User from '../../models/User.js';
import crypto from 'crypto';
import { sendOrderConfirmationEmail } from '../../utils/sendOrderConfirmationEmail.js';
import { sendAdminNewOrderNotification } from '../../utils/sendAdminNewOrderNotification.js';

export default class ClientOrderService {
    constructor() {
        connectMongoDB();
    }

    // getNextWeekdayDate(dayName, hourString) {
    //     const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    //     const today = new Date();
    //     const todayDay = today.getDay();
    //     const targetDay = daysOfWeek.indexOf(dayName.toLowerCase());

    //     let daysUntilTarget = targetDay - todayDay;
    //     if (daysUntilTarget < 0 || (daysUntilTarget === 0 && this.isPastHour(hourString))) {
    //         daysUntilTarget += 7;
    //     }

    //     const targetDate = new Date();
    //     targetDate.setDate(today.getDate() + daysUntilTarget);

    //     const [hour, minute] = hourString.split(':').map(Number);
    //     targetDate.setHours(hour, minute, 0, 0);

    //     return targetDate;
    // }


    // isPastHour(hourString) {
    //     const now = new Date();
    //     const [hour, minute] = hourString.split(':').map(Number);
    //     return now.getHours() > hour || (now.getHours() === hour && now.getMinutes() > minute);
    // }


    getNextWeekdayDate(dayName, hourString) {
        // Queremos que deliveryDate represente el DÍA de entrega (Chile).
        // Fijamos SIEMPRE 12:00 Chile y convertimos a UTC para Mongo.

        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        // 1) "Ahora" en Chile
        const clNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
        const todayIdxCL = clNow.getDay();
        const targetIdx = daysOfWeek.indexOf(String(dayName).toLowerCase());

        // 2) Días hasta el objetivo (sin sumar 7 si es hoy)
        let daysUntilTarget = targetIdx - todayIdxCL;
        if (daysUntilTarget < 0) daysUntilTarget += 7;

        // 3) Fecha objetivo en CHILE a las 12:00
        const y = clNow.getFullYear(), m = clNow.getMonth(), d = clNow.getDate();
        const targetCL = new Date(y, m, d + daysUntilTarget, 12, 0, 0, 0); // ← mediodía

        // 4) Convertir CHILE → UTC para guardar
        const serverNow = new Date();
        const tzDiffMs = serverNow.getTime() - clNow.getTime(); // servidor - Chile
        const targetUTC = new Date(targetCL.getTime() + tzDiffMs);
        targetUTC.setMilliseconds(0);

        // 🔎 Huella en logs (deja mientras depuras)
        console.log('🧭 getNextWeekdayDate:',
            { dayName, hourString, targetCL: targetCL.toString(), targetUTC: targetUTC.toISOString() });

        return targetUTC;
    }

    isPastHour(hourString) {
        // Correcta en hora Chile (por si la usas en otros lados).
        const clNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
        const [hour, minute] = hourString.split(':').map(Number);
        const hNow = clNow.getHours();
        const mNow = clNow.getMinutes();
        return hNow > hour || (hNow === hour && mNow > minute);
    }


    async findOrCreateClient({ name, email, password, phone, address, block, lat, lon, storeId }) {
        const normEmail = (email || '').toLowerCase().trim();
        let user = await Clients.findOne({ email: normEmail });

        if (!user) {
            const generatedPassword = password || 'fluvi-' + crypto.randomInt(1000, 9999);

            user = new Clients({
                name: (name || '').trim(),
                email: normEmail,
                password: generatedPassword, // ⚠️ considera hashear con bcrypt en prod
                storeId,
                phone: (phone || '').trim(),
                address: (address || '').trim(),
                block: (block || '').trim(),      // 👈 guardar block si viene
                lat,
                lon,
            });

            await user.save();
            console.log('👤 Usuario creado automáticamente:', user._id);

            return { user, wasCreated: true, generatedPassword };
        } else {
            // Actualiza datos “suaves” si llegan (sin pisar con vacío)
            const updates = {};
            if (address && address.trim()) updates.address = address.trim();
            if (typeof block === 'string' && block.trim()) updates.block = block.trim(); // 👈 actualizar block si llega
            if (lat != null) updates.lat = lat;
            if (lon != null) updates.lon = lon;

            if (Object.keys(updates).length) {
                await Clients.updateOne({ _id: user._id }, { $set: updates });
                user = await Clients.findById(user._id);
            }

            console.log('✅ Usuario ya existía:', user._id);
            return { user, wasCreated: false };
        }
    }





    // createOrder = async (data) => {
    //     try {
    //         // 📅 Calcular fecha de entrega si se indica horario
    //         if (data.deliverySchedule?.day && data.deliverySchedule?.hour) {
    //             const deliveryDate = this.getNextWeekdayDate(data.deliverySchedule.day, data.deliverySchedule.hour);
    //             data.deliveryDate = deliveryDate;
    //         }

    //         // 👤 Buscar o crear el usuario
    //         const { user, wasCreated, generatedPassword } = await this.findOrCreateClient({
    //             name: data.customer.name,
    //             email: data.customer.email,
    //             password: data.customer.password,
    //             phone: data.customer.phone,
    //             address: data.customer.address,
    //             lat: data.customer.lat,
    //             lon: data.customer.lon,
    //             storeId: data.storeId,
    //         });

    //         // 🔗 Copiar todos los datos del usuario al pedido
    //         data.customer = {
    //             id: user._id,
    //             name: user.name,
    //             email: user.email,
    //             phone: user.phone,
    //             address: user.address,
    //             lat: user.lat,
    //             lon: user.lon,
    //             notificationToken: user.token, // ✅ ESTA LÍNEA ES CRUCIAL
    //         };

    //         // 🚚 Asignar automáticamente un dealer por zona (si hay zoneId)
    //         if (data.zoneId) {
    //             const zone = await Zones.findById(data.zoneId).lean();

    //             if (zone?.dealerId) {
    //                 const dealer = await Dealers.findById(zone.dealerId).lean();

    //                 if (dealer) {
    //                     console.log('🚚 Dealer asignado automáticamente:', dealer.name);
    //                     data.deliveryPerson = {
    //                         id: dealer._id.toString(),
    //                         name: dealer.name,
    //                     };
    //                 } else {
    //                     console.log('⚠️ No se encontró dealer con ese dealerId:', zone.dealerId);
    //                 }
    //             } else {
    //                 console.log('⚠️ La zona no tiene dealer asignado');
    //             }
    //         }

    //         // 🧾 Crear el pedido
    //         const newOrder = new Order(data);
    //         await newOrder.save();

    //         // 📧 Enviar correo de confirmación (con contraseña si fue creado)
    //         const { email, name } = newOrder.customer || {};
    //         if (email) {
    //             await sendOrderConfirmationEmail({
    //                 email,
    //                 name,
    //                 deliveryDate: newOrder.deliveryDate,
    //                 password: wasCreated ? generatedPassword : undefined,
    //             });
    //         }

    //         // 🔔 Notificar al admin de ese store
    //         const admin = await User.findOne({ storeId: data.storeId, role: 'admin' });
    //         console.log(admin?.admin?.mail);
    //         console.log('📧 Notificando al admin:', admin.mail);
    //         if (admin?.mail) {
    //             await sendAdminNewOrderNotification({ email: admin.mail, order: newOrder });
    //         }

    //         // ✅ Retornar también el usuario para autologin
    //         return {
    //             success: true,
    //             message: 'Pedido creado exitosamente',
    //             data: {
    //                 order: newOrder,
    //                 user,
    //             },
    //         };
    //     } catch (error) {
    //         console.error('❌ ClientOrderService - error en createOrder:', error);
    //         return {
    //             success: false,
    //             message: 'No se pudo crear el pedido',
    //         };
    //     }
    // };


    createOrder = async (data) => {
        try {
            // 📅 deliveryDate = DÍA de entrega (Chile) a las 12:00, convertido a UTC
            if (data.deliverySchedule?.day && data.deliverySchedule?.hour) {
                const deliveryDate = this.getNextWeekdayDate(
                    data.deliverySchedule.day,
                    data.deliverySchedule.hour
                );
                console.log('🧾 DELIVERY (final):', {
                    day: data.deliverySchedule.day,
                    hour: data.deliverySchedule.hour,
                    deliveryDateUTC: deliveryDate.toISOString()
                });
                data.deliveryDate = deliveryDate;
            }

            // 👤 Buscar/crear usuario (incluye block)
            const { user, wasCreated, generatedPassword } = await this.findOrCreateClient({
                name: data.customer.name,
                email: data.customer.email,
                password: data.customer.password,
                phone: data.customer.phone,
                address: data.customer.address,
                block: data.customer.block,      // 👈 NUEVO
                lat: data.customer.lat,
                lon: data.customer.lon,
                storeId: data.storeId,
            });

            // 🔗 Copiar datos usuario al pedido (incluye block)
            data.customer = {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                block: user.block || '',           // 👈 NUEVO
                lat: user.lat,
                lon: user.lon,
                notificationToken: user.token,
            };

            // 🚚 Dealer por zona (si aplica)
            if (data.zoneId) {
                const zone = await Zones.findById(data.zoneId).lean();
                if (zone?.dealerId) {
                    const dealer = await Dealers.findById(zone.dealerId).lean();
                    if (dealer) {
                        console.log('🚚 Dealer asignado automáticamente:', dealer.name);
                        data.deliveryPerson = { id: dealer._id.toString(), name: dealer.name };
                    } else {
                        console.log('⚠️ No se encontró dealer con ese dealerId:', zone.dealerId);
                    }
                } else {
                    console.log('⚠️ La zona no tiene dealer asignado');
                }
            }

            // 🧾 Crear pedido
            const newOrder = new Order(data);
            await newOrder.save();

            // 📧 Confirmación
            const { email, name } = newOrder.customer || {};
            if (email) {
                await sendOrderConfirmationEmail({
                    email,
                    name,
                    deliveryDate: newOrder.deliveryDate,
                    deliverySchedule: newOrder.deliverySchedule,
                    password: wasCreated ? generatedPassword : undefined,
                });
            }

            // 🔔 Notificar admin
            const admin = await User.findOne({ storeId: data.storeId, role: 'admin' });
            console.log('📧 Notificando al admin:', admin?.mail);
            if (admin?.mail) {
                await sendAdminNewOrderNotification({ email: admin.mail, order: newOrder });
            }

            return { success: true, message: 'Pedido creado exitosamente', data: { order: newOrder, user } };
        } catch (error) {
            console.error('❌ ClientOrderService - error en createOrder:', error);
            return { success: false, message: 'No se pudo crear el pedido' };
        }
    }





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
