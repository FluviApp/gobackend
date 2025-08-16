import connectMongoDB from '../../libs/mongoose.js';
import Orders from '../../models/Orders.js';
import User from '../../models/User.js';
import Notifications from '../../models/Notifications.js';
import { sendOrderStatusUpdateEmail } from '../../utils/sendOrderStatusUpdateEmail.js';
import { sendPushNotification } from '../../utils/sendPushNotification.js';

export default class StoreOrdersService {
    constructor() {
        connectMongoDB();
    }

    getAllOrders = async ({ storeId, page = 1, limit = 50, startDate, endDate, status, transferPay }) => {
        console.log('🧪 startDate:', startDate);
        console.log('🧪 endDate:', endDate);
        console.log('🧪 storeId:', storeId);
        console.log('🧪 status:', status);
        console.log('🧪 transferPay:', transferPay);

        try {
            if (!storeId) {
                return { success: false, message: 'storeId es requerido' };
            }

            const query = { storeId };

            // Filtro por rango de fechas (deliveryDate)
            if (startDate && endDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);

                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);

                query.deliveryDate = { $gte: start, $lte: end };
            }

            // Filtro por estado (si viene)
            if (status) {
                query.status = status;
            }

            // Filtro por transferPay (si viene explícitamente, como string)
            if (typeof transferPay !== 'undefined') {
                query.transferPay = transferPay === 'true';
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
            // 📅 Calcular fecha de entrega si no viene explícita
            if ((!data.deliveryDate || data.deliveryDate === '') && data.deliverySchedule?.day && data.deliverySchedule?.hour) {
                const deliveryDate = this.getNextWeekdayDate(data.deliverySchedule.day, data.deliverySchedule.hour);
                data.deliveryDate = deliveryDate;
            }

            // 👤 Si tiene un cliente asignado, completar sus datos desde DB
            if (data.customer?.id) {

                const user = await User.findById(data.customer.id).lean();
                console.log(user.email + '   ------ correo del usuario')
                if (user) {
                    data.customer = {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        address: user.address,
                        lat: user.lat,
                        lon: user.lon,
                        notificationToken: user.token || '', // ✅
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





    // updateOrder = async (id, data) => {
    //     try {
    //         console.log('🧪 Ejecutando updateOrder con ID:', id);
    //         console.log('🧪 Datos recibidos para actualizar:', data);

    //         // 1️⃣ Obtener el pedido actual
    //         const existingOrder = await Orders.findById(id);
    //         if (!existingOrder) {
    //             console.warn('⚠️ Pedido no encontrado');
    //             return { success: false, message: 'Pedido no encontrado' };
    //         }

    //         const previousStatus = existingOrder.status;
    //         const newStatus = data.status;
    //         const previousPaymentMethod = existingOrder.paymentMethod;
    //         const newPaymentMethod = data.paymentMethod;

    //         console.log(`🔄 Estado anterior: ${previousStatus} → Nuevo: ${newStatus}`);
    //         console.log(`💳 Método de pago anterior: ${previousPaymentMethod} → Nuevo: ${newPaymentMethod}`);

    //         // 2️⃣ Lógica para actualizar transferPay:
    //         // 2️⃣ Lógica para actualizar transferPay:
    //         // 2️⃣ Lógica para actualizar transferPay
    //         console.log('🔍 Evaluando el campo transferPay...');

    //         if (typeof data.transferPay !== 'undefined') {
    //             console.log('🔧 transferPay recibido explícitamente, se mantiene:', data.transferPay);
    //             // No hacemos nada, se respeta el valor recibido
    //         } else {
    //             // Si no vino transferPay, aplicar lógica automática como fallback
    //             const finalPaymentMethod = data.paymentMethod || existingOrder.paymentMethod;
    //             if (newStatus === 'entregado' && finalPaymentMethod === 'transferencia') {
    //                 console.log('✅ Estado "entregado" y método de pago "transferencia", se establece transferPay en false');
    //                 data.transferPay = false;
    //             } else {
    //                 console.log('❌ Estado no es "entregado" o método de pago no es "transferencia", se establece transferPay en true');
    //                 data.transferPay = true;
    //             }
    //         }


    //         // Log de los datos después de actualizar transferPay
    //         console.log('📝 Datos después de la actualización de transferPay:', data);


    //         // 3️⃣ Actualizar el pedido
    //         const updated = await Orders.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });

    //         // 4️⃣ Si cambió el estado, enviar correo y notificación push
    //         if (newStatus && newStatus !== previousStatus) {
    //             const { name, email, notificationToken } = updated.customer || {};
    //             console.log('👤 Cliente actualizado:', { name, email, notificationToken });

    //             // Enviar correo
    //             if (email) {
    //                 try {
    //                     console.log('📨 Enviando correo de estado actualizado...');
    //                     await sendOrderStatusUpdateEmail({ name, email, status: newStatus });
    //                     console.log('✅ Correo enviado con éxito');
    //                 } catch (e) {
    //                     console.error('❌ Error al enviar el correo:', e);
    //                 }
    //             } else {
    //                 console.warn('⚠️ No se encontró email del cliente');
    //             }

    //             // Enviar notificación push
    //             if (notificationToken) {
    //                 try {
    //                     console.log('📲 Enviando notificación push...');
    //                     const response = await fetch('https://exp.host/--/api/v2/push/send', {
    //                         method: 'POST',
    //                         headers: {
    //                             'Accept': 'application/json',
    //                             'Accept-Encoding': 'gzip, deflate',
    //                             'Content-Type': 'application/json',
    //                         },
    //                         body: JSON.stringify({
    //                             to: notificationToken,
    //                             sound: 'default',
    //                             title: '📦 Estado actualizado',
    //                             body: `Tu pedido está ahora: ${newStatus.replace('_', ' ')}`,
    //                         }),
    //                     });
    //                     const result = await response.json();
    //                     console.log('✅ Notificación enviada:', result);
    //                 } catch (e) {
    //                     console.error('❌ Error al enviar notificación push:', e);
    //                 }
    //             } else {
    //                 console.warn('⚠️ No se encontró token de notificación del cliente');
    //             }
    //         }

    //         return {
    //             success: true,
    //             message: 'Pedido actualizado correctamente',
    //             data: updated
    //         };
    //     } catch (error) {
    //         console.error('❌ Error al actualizar pedido:', error);
    //         return {
    //             success: false,
    //             message: 'Error al actualizar pedido'
    //         };
    //     }
    // };



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

            // 2️⃣ Lógica para actualizar transferPay
            console.log('🔍 Evaluando el campo transferPay...');

            if (typeof data.transferPay !== 'undefined') {
                console.log('🔧 transferPay recibido explícitamente, se mantiene:', data.transferPay);
            } else {
                const finalPaymentMethod = data.paymentMethod || existingOrder.paymentMethod;
                if (newStatus === 'entregado' && finalPaymentMethod === 'transferencia') {
                    console.log('✅ Estado "entregado" y método de pago "transferencia", se establece transferPay en false');
                    data.transferPay = false;
                } else {
                    console.log('❌ Estado no es "entregado" o método de pago no es "transferencia", se establece transferPay en true');
                    data.transferPay = true;
                }
            }

            console.log('📝 Datos después de la actualización de transferPay:', data);

            // 3️⃣ Actualizar el pedido
            const updated = await Orders.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });

            // 4️⃣ Si cambió el estado, enviar notificaciones y guardar en DB
            if (newStatus && newStatus !== previousStatus) {
                const { name, email, notificationToken } = updated.customer || {};
                const storeId = updated.storeId;

                console.log('👤 Cliente actualizado:', { name, email, notificationToken });

                // 📧 Enviar correo
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

                // 📲 Enviar notificación push
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

                // 📝 Guardar en colección Notifications
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

    // Service (Backend) - Verificar que los datos se obtienen correctamente
    getPendingOrders = async ({ storeId }) => {
        const estadosExcluidos = ['entregado']; // Solo excluimos 'entregado'

        try {
            const today = new Date();
            today.setHours(23, 59, 59, 999); // Final de día

            const query = {
                storeId,
                deliveryType: 'domicilio',
                deliveryDate: { $lte: today }, // Solo pedidos hasta hoy
                status: { $nin: estadosExcluidos }, // Excluir 'entregado'
            };

            console.log("🔍 Consulta que se va a ejecutar:", query);

            const result = await Orders.find(query).sort({ deliveryDate: 1 });

            console.log('🏷️ Resultados obtenidos:', result);

            return {
                success: true,
                message: 'Pedidos hasta hoy obtenidos correctamente',
                data: result, // Devuelve los resultados como un array de pedidos
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
