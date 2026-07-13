import Order from '../../models/Orders.js';
import Stores from '../../models/Stores.js';
import Notifications from '../../models/Notifications.js';
import { sendOrderStatusUpdateEmail } from '../../utils/sendOrderStatusUpdateEmail.js';
import { sendPushNotification } from '../../utils/sendPushNotification.js';
import { DELIVERY_STORE_IDS } from '../../config/deliveryStores.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'America/Santiago';

export default class DeliveryOrdersService {

    getOrdersByStoreGroup = async () => {
        try {
            const allowedStores = DELIVERY_STORE_IDS;

            console.log('📦 Buscando pedidos para tiendas:', allowedStores);

            // Fin del día de HOY en hora de Chile → UTC. Incluye pendientes de hoy y anteriores.
            const endOfTodayUtc = dayjs().tz(TZ).endOf('day').utc().toDate();

            const query = {
                storeId: { $in: allowedStores },
                status: { $nin: ['entregado', 'devuelto', 'cancelado'] },
                deliveryDate: { $lte: endOfTodayUtc },
                deliveryType: 'domicilio',
            };

            console.log('🔍 Consulta Mongo:', JSON.stringify(query, null, 2));

            // Se muestran TODOS los pedidos pendientes del día sin importar la hora actual.
            // (Se eliminó el corte de las 14:00 que ocultaba entregas de la tarde.)
            const orders = await Order.find(query).sort({ deliveryDate: 1, 'deliverySchedule.hour': 1 });

            console.log(`✅ Se encontraron ${orders.length} pedidos`);

            const storeIds = [...new Set(orders.map(o => o.storeId))];
            const stores = await Stores.find(
                { _id: { $in: storeIds } },
                { name: 1, image: 1 }
            );

            const storeMap = {};
            stores.forEach(store => {
                storeMap[store._id.toString()] = {
                    name: store.name,
                    image: store.image,
                };
            });

            const enrichedOrders = orders.map(order => ({
                ...order.toObject(),
                storeInfo: storeMap[order.storeId] || null,
            }));

            return enrichedOrders;
        } catch (error) {
            console.error('❌ Error en getOrdersByStoreGroup:', error);
            throw error;
        }
    };




    // getClosedOrdersByStoreGroup = async () => {
    //     try {
    //         const allowedStores = ['686475c9b8bfd36c37a820c3', '68697bf9c8e5172fd536738f'];

    //         console.log('📦 Buscando pedidos cerrados para tiendas:', allowedStores);

    //         const query = {
    //             storeId: { $in: allowedStores },
    //             status: { $in: ['entregado', 'devuelto', 'cancelado'] },
    //         };

    //         console.log('🔍 Consulta Mongo:', JSON.stringify(query, null, 2));

    //         // Buscar pedidos
    //         const orders = await Order.find(query).sort({ createdAt: -1 });

    //         console.log(`✅ Se encontraron ${orders.length} pedidos cerrados`);

    //         // Extraer storeIds únicos
    //         const storeIds = [...new Set(orders.map(o => o.storeId))];

    //         // Buscar info de tiendas
    //         const stores = await Stores.find(
    //             { _id: { $in: storeIds } },
    //             { name: 1, image: 1 }
    //         );

    //         // Crear mapa de info de tiendas
    //         const storeMap = {};
    //         stores.forEach(store => {
    //             storeMap[store._id.toString()] = {
    //                 name: store.name,
    //                 image: store.image,
    //             };
    //         });

    //         // Enriquecer pedidos con storeInfo
    //         const enrichedOrders = orders.map(order => ({
    //             ...order.toObject(),
    //             storeInfo: storeMap[order.storeId] || null,
    //         }));

    //         return enrichedOrders;
    //     } catch (error) {
    //         console.error('❌ Error en getClosedOrdersByStoreGroup:', error);
    //         throw error;
    //     }
    // };

    getClosedOrdersByStoreGroup = async () => {
        try {
            const allowedStores = DELIVERY_STORE_IDS;

            // Calcular inicio y fin del día según hora de Chile y convertir a UTC
            const startUtc = dayjs().tz(TZ).startOf('day').utc().toDate();
            const endUtc = dayjs().tz(TZ).endOf('day').utc().toDate();

            console.log('📅 Rango HOY (Chile) → UTC:', { startUtc, endUtc });

            const query = {
                storeId: { $in: allowedStores },
                status: { $in: ['entregado', 'devuelto', 'cancelado'] },
                deliveryDate: { $gte: startUtc, $lte: endUtc },
                deliveryType: 'domicilio',
            };

            console.log('🔍 Consulta Mongo:', JSON.stringify(query, null, 2));

            // Buscar pedidos cerrados de hoy
            const orders = await Order.find(query).sort({ createdAt: -1 });
            console.log(`✅ Se encontraron ${orders.length} pedidos cerrados de HOY (Chile)`);

            // Obtener IDs únicos de tiendas
            const storeIds = [...new Set(orders.map(o => o.storeId?.toString()))].filter(Boolean);

            // Buscar info de las tiendas
            const stores = await Stores.find(
                { _id: { $in: storeIds } },
                { name: 1, image: 1 }
            );

            // Crear mapa rápido de tiendas
            const storeMap = {};
            for (const store of stores) {
                storeMap[store._id.toString()] = {
                    name: store.name,
                    image: store.image,
                };
            }

            // Enriquecer pedidos con info de tienda
            const enrichedOrders = orders.map(order => ({
                ...order.toObject(),
                storeInfo: storeMap[order.storeId?.toString()] || null,
            }));

            return enrichedOrders;
        } catch (error) {
            console.error('❌ Error en getClosedOrdersByStoreGroup:', error);
            throw error;
        }
    };



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

            // Enriquecer con info de la tienda (nombre e imagen) para el front
            const storeIds = [...new Set(orders.map(o => o.storeId?.toString()))].filter(Boolean);
            const stores = await Stores.find(
                { _id: { $in: storeIds } },
                { name: 1, image: 1 }
            );

            const storeMap = {};
            for (const store of stores) {
                storeMap[store._id.toString()] = {
                    name: store.name,
                    image: store.image,
                };
            }

            const enrichedOrders = orders.map(order => ({
                ...order.toObject(),
                storeInfo: storeMap[order.storeId?.toString()] || null,
            }));

            return enrichedOrders;
        } catch (error) {
            console.error('❌ Error en getActiveOrdersByDeliveryId:', error);
            throw error;
        }
    }

    getFinalizedTodayByDeliveryId = async (deliveryId) => {
        try {
            const now = new Date();
            const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
            const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

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

            // 1️⃣ Asegurar que no se pierda el paymentMethod
            const finalPaymentMethod = updateData.paymentMethod || existingOrder.paymentMethod;

            // 2️⃣ Lógica para transferPay
            if (newStatus === 'entregado' && finalPaymentMethod === 'transferencia') {
                updateData.transferPay = false;
            } else if (newStatus !== 'entregado' || finalPaymentMethod !== 'transferencia') {
                updateData.transferPay = true;
            }

            // 3️⃣ Actualizar pedido
            const updated = await Order.findByIdAndUpdate(orderId, updateData, {
                new: true,
                runValidators: true,
            });

            // 4️⃣ Si el estado cambió, enviar notificaciones y guardar registro
            if (newStatus && newStatus !== previousStatus) {
                const { name, email, notificationToken } = updated.customer || {};
                const storeId = updated.storeId;

                // 📧 Enviar correo
                if (email) {
                    try {
                        await sendOrderStatusUpdateEmail({ name, email, status: newStatus });
                        console.log('✅ Correo de actualización enviado');
                    } catch (e) {
                        console.error('❌ Error al enviar correo:', e);
                    }
                }

                // 📲 Enviar notificación push
                if (notificationToken) {
                    try {
                        await sendPushNotification({ token: notificationToken, status: newStatus });
                        console.log('📲 Notificación push enviada');
                    } catch (e) {
                        console.error('❌ Error al enviar notificación push:', e);
                    }
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

            return updated;
        } catch (error) {
            console.error('❌ Error en updateOrderById:', error);
            throw error;
        }
    };



    // updateOrderById = async (orderId, updateData) => {
    //     try {
    //         const existingOrder = await Order.findById(orderId);
    //         if (!existingOrder) throw new Error('Pedido no encontrado');

    //         const previousStatus = existingOrder.status;
    //         const newStatus = updateData.status;

    //         // 1️⃣ Lógica para asegurar que el campo `paymentMethod` no se pierda
    //         const finalPaymentMethod = updateData.paymentMethod || existingOrder.paymentMethod;

    //         // 2️⃣ Lógica para actualizar el campo `transferPay`
    //         if (newStatus === 'entregado' && finalPaymentMethod === 'transferencia') {
    //             // Si el pedido es entregado y el pago es transferencia, transferPay se establece en 'false'
    //             updateData.transferPay = false;
    //         } else if (newStatus !== 'entregado' || finalPaymentMethod !== 'transferencia') {
    //             // Si el estado no es 'entregado' o el método de pago no es transferencia, transferPay se restablece a 'true'
    //             updateData.transferPay = true;
    //         }

    //         // 3️⃣ Actualizamos el pedido
    //         const updated = await Order.findByIdAndUpdate(orderId, updateData, {
    //             new: true,
    //             runValidators: true,
    //         });

    //         // 4️⃣ Enviar correo y notificación push si el estado cambió
    //         if (newStatus && newStatus !== previousStatus) {
    //             const { name, email, notificationToken } = updated.customer || {};

    //             // 📧 Enviar correo
    //             if (email) {
    //                 try {
    //                     await sendOrderStatusUpdateEmail({ name, email, status: newStatus });
    //                     console.log('✅ Correo de actualización enviado');
    //                 } catch (e) {
    //                     console.error('❌ Error al enviar correo:', e);
    //                 }
    //             }

    //             // 📲 Enviar notificación push
    //             if (notificationToken) {
    //                 try {
    //                     await sendPushNotification({ token: notificationToken, status: newStatus });
    //                     console.log('📲 Notificación push enviada');
    //                 } catch (e) {
    //                     console.error('❌ Error al enviar notificación push:', e);
    //                 }
    //             }
    //         }

    //         return updated;
    //     } catch (error) {
    //         console.error('❌ Error en updateOrderById:', error);
    //         throw error;
    //     }
    // };



}
