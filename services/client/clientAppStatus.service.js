import connectMongoDB from '../../libs/mongoose.js';
import { DateTime } from 'luxon';
import Commerce from '../../models/Commerce.js';
import Zones from '../../models/Zones.js';
import Stores from '../../models/Stores.js';
import Order from '../../models/Orders.js';

export default class ClientAppStatusService {
    constructor() {
        connectMongoDB();
    }

    getAppStatus = async () => {
        try {
            const commerce = await Commerce.findOne().lean(); // 👈 sin condiciones

            if (!commerce) {
                return {
                    success: false,
                    message: 'Comercio no encontrado',
                };
            }

            return {
                success: true,
                message: 'Estado de app obtenido correctamente',
                data: {
                    isPaymentActive: commerce.isPaymentActive,
                    appVersion: commerce.appVersion,
                    //ecommerceId: commerce.ecommerceId?.toString()
                },
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener estado de app:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener estado de app',
            };
        }
    };


    getStoreData = async (storeId) => {
        try {
            const store = await Stores.findOne({ _id: storeId }).lean();
            if (!store) {
                return { success: false, message: 'Tienda no encontrada' };
            }

            const zones = await Zones.find({ storeId }).lean();
            if (!zones || zones.length === 0) {
                return { success: false, message: 'Zonas de entrega no encontradas' };
            }

            // 1. Contar TODOS los pedidos para hoy, sin importar el estado
            const nowInChile = DateTime.now().setZone('America/Santiago');
            const startOfDay = nowInChile.startOf('day').toJSDate();
            const endOfDay = nowInChile.endOf('day').toJSDate();

            // 🔽 CAMBIO: Usamos find() en lugar de countDocuments() para obtener los pedidos
            const todayOrders = await Order.find({
                storeId: storeId,
                deliveryDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });
            const todayOrderCount = todayOrders.length;
            const orderIds = todayOrders.map(order => order._id);

            // 🔽 Ahora el log muestra el conteo y los IDs de los pedidos encontrados
            console.log(`✅ TOTAL de pedidos para hoy (${nowInChile.toISODate()}): ${todayOrderCount} pedidos`);
            console.log(`✅ IDs de los pedidos encontrados:`, orderIds);
            // 🔽 Nuevo log para mostrar la fecha de entrega de cada pedido
            todayOrders.forEach(order => {
                console.log(`🔍 Pedido ID: ${order._id}, Fecha de entrega: ${order.deliveryDate.toISOString()}`);
            });
            console.log(`✅ Límite de pedidos para hoy: 10`);

            // 2. Usamos Luxon para obtener la hora actual en la zona horaria de Chile
            const currentHour = nowInChile.hour;
            const currentMinute = nowInChile.minute;
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

            const filterSchedule = (schedule) => {
                const filtered = {};
                let foundDays = 0;
                let offset = 0;

                while (foundDays < 4 && offset < 14) {
                    const date = nowInChile.plus({ days: offset });
                    // 🔽 Ajustamos el índice de día para que coincida con el array daysOfWeek
                    const dayKey = daysOfWeek[date.weekday === 7 ? 0 : date.weekday];
                    const dayConfig = schedule[dayKey];

                    if (!dayConfig?.enabled || !dayConfig?.hours) {
                        offset++;
                        continue;
                    }

                    // 3. Lógica para eliminar horarios de hoy si hay 10 o más pedidos
                    if (offset === 0 && todayOrderCount >= 10) {
                        console.log('⛔ Se han superado los 10 pedidos del día. Horarios de hoy desactivados.');
                        offset++;
                        continue;
                    }

                    const validHours = {};
                    Object.entries(dayConfig.hours).forEach(([hourStr, isActive]) => {
                        if (!isActive) return;

                        const [hour, minute] = hourStr.split(':').map(Number);

                        if (offset === 0) {
                            if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
                                return;
                            }
                        }

                        validHours[hourStr] = true;
                    });

                    if (Object.keys(validHours).length > 0) {
                        // 🔽 Log para mostrar la fecha y los horarios que se agregan
                        console.log(`🔍 Horarios disponibles para ${date.toISODate()} (${dayKey}):`, validHours);
                        filtered[dayKey] = {
                            enabled: true,
                            hours: validHours
                        };
                        foundDays++;
                    }

                    offset++;
                }

                console.log('📤 Horarios filtrados (para frontend):', JSON.stringify(filtered, null, 2));
                return filtered;
            };

            const formattedZones = zones.map(zone => ({
                deliveryCost: zone.deliveryCost,
                schedule: filterSchedule(zone.schedule)
            }));

            return {
                success: true,
                message: 'Datos de tienda obtenidos correctamente',
                data: {
                    paymentMethods: store.paymentmethod,
                    deliveryZones: formattedZones
                }
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener datos de tienda:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener datos de tienda',
            };
        }
    };




}
