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

    //funciona con hora chilena pero sin conteo de pedidos
    // getStoreData = async (storeId) => {

    //     try {

    //         const store = await Stores.findOne({ _id: storeId }).lean();

    //         if (!store) {
    //             return { success: false, message: 'Tienda no encontrada' };
    //         }

    //         const zones = await Zones.find({ storeId }).lean();

    //         if (!zones || zones.length === 0) {
    //             return { success: false, message: 'Zonas de entrega no encontradas' };
    //         }

    //         // 🔽 Agregamos filtrado de horarios válidos con hora de Chile
    //         const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
    //         const todayIndex = now.getDay(); // 0 = domingo, ..., 6 = sábado
    //         const currentHour = now.getHours();
    //         const currentMinute = now.getMinutes();
    //         const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    //         const filterSchedule = (schedule) => {
    //             const filtered = {};

    //             const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
    //             const currentHour = now.getHours();
    //             const currentMinute = now.getMinutes();
    //             const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    //             let foundDays = 0;
    //             let offset = 0;

    //             while (foundDays < 4 && offset < 14) {
    //                 const date = new Date(now);
    //                 date.setDate(now.getDate() + offset);

    //                 const index = date.getDay(); // 0-6
    //                 const dayKey = daysOfWeek[index];
    //                 const dayConfig = schedule[dayKey];

    //                 if (!dayConfig?.enabled || !dayConfig?.hours) {
    //                     offset++;
    //                     continue;
    //                 }

    //                 const validHours = {};
    //                 Object.entries(dayConfig.hours).forEach(([hourStr, isActive]) => {
    //                     if (!isActive) return;

    //                     const [hour, minute] = hourStr.split(':').map(Number);

    //                     if (offset === 0) {
    //                         if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
    //                             return;
    //                         }
    //                     }

    //                     validHours[hourStr] = true;
    //                 });

    //                 if (Object.keys(validHours).length > 0) {
    //                     filtered[dayKey] = {
    //                         enabled: true,
    //                         hours: validHours
    //                     };
    //                     foundDays++;
    //                 }

    //                 offset++;
    //             }

    //             console.log('📤 Horarios filtrados (para frontend):', JSON.stringify(filtered, null, 2));
    //             return filtered;
    //         };

    //         const formattedZones = zones.map(zone => ({
    //             deliveryCost: zone.deliveryCost,
    //             schedule: filterSchedule(zone.schedule)
    //         }));

    //         return {
    //             success: true,
    //             message: 'Datos de tienda obtenidos correctamente',
    //             data: {
    //                 paymentMethods: store.paymentmethod,
    //                 deliveryZones: formattedZones
    //             }
    //         };

    //     } catch (error) {
    //         console.error('❌ Servicio - Error al obtener datos de tienda:', error);
    //         return {
    //             success: false,
    //             message: 'Error inesperado al obtener datos de tienda',
    //         };
    //     }

    // };

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

            // 🔽 Hora Chile garantizada
            const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
            const todayIndex = now.getDay(); // 0 = domingo, ..., 6 = sábado
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

            // 🔽 Calcular inicio/fin de HOY en Chile como fechas UTC para Mongo
            const serverNow = new Date(); // hora del servidor
            const clNow = new Date(serverNow.toLocaleString("en-US", { timeZone: "America/Santiago" }));
            const tzDiffMs = serverNow.getTime() - clNow.getTime(); // diferencia UTC vs Chile en ms

            const y = clNow.getFullYear(), m = clNow.getMonth(), d = clNow.getDate();
            const startCLLocal = new Date(y, m, d, 0, 0, 0, 0);
            const endCLLocal = new Date(y, m, d, 23, 59, 59, 999);
            const todayStartUTC = new Date(startCLLocal.getTime() + tzDiffMs);
            const todayEndUTC = new Date(endCLLocal.getTime() + tzDiffMs);

            // 🔽 Contar pedidos con entrega HOY (excluye cancelado)
            const todayOrdersCount = await Order.countDocuments({
                storeId,
                status: { $nin: ['cancelado'] },
                deliveryDate: { $gte: todayStartUTC, $lte: todayEndUTC }
            });

            // 🔽 Si supera el umbral, no ofrecer horarios de HOY
            const BLOCK_TODAY_THRESHOLD = 10;
            const shouldBlockToday = todayOrdersCount > BLOCK_TODAY_THRESHOLD;

            const filterSchedule = (schedule) => {
                const filtered = {};

                // Recalcular “ahora” en Chile dentro de la función
                const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

                let foundDays = 0;
                let offset = 0;

                while (foundDays < 4 && offset < 14) {
                    const date = new Date(now);
                    date.setDate(now.getDate() + offset);

                    const index = date.getDay(); // 0-6
                    const dayKey = daysOfWeek[index];
                    const dayConfig = schedule[dayKey];

                    if (!dayConfig?.enabled || !dayConfig?.hours) {
                        offset++;
                        continue;
                    }

                    // 🚫 Si hoy está bloqueado por capacidad, saltamos todo el día
                    if (offset === 0 && shouldBlockToday) {
                        offset++;
                        continue;
                    }

                    const validHours = {};
                    Object.entries(dayConfig.hours).forEach(([hourStr, isActive]) => {
                        if (!isActive) return;

                        const [hour, minute] = hourStr.split(':').map(Number);

                        // Para hoy, descarta horas ya pasadas
                        if (offset === 0) {
                            if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
                                return;
                            }
                        }

                        validHours[hourStr] = true;
                    });

                    if (Object.keys(validHours).length > 0) {
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
