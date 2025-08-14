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
            if (!store) return { success: false, message: 'Tienda no encontrada' };

            const zones = await Zones.find({ storeId }).lean();
            if (!zones || zones.length === 0) {
                return { success: false, message: 'Zonas de entrega no encontradas' };
            }

            // ====== LOGS DE HORA/FECHA ======
            const fmt = (d) => ({
                ts: d.getTime(),
                iso: d.toISOString(),
                local: d.toString(),
                cl: new Date(d.toLocaleString('en-US', { timeZone: 'America/Santiago' })).toString(),
                cl_str: d.toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
            });

            const nowCL = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
            const nowSrv = new Date();

            console.log('🕒 NOW (Servidor/local):', fmt(nowSrv));
            console.log('🕒 NOW (America/Santiago):', fmt(nowCL));

            const todayIndex = nowCL.getDay(); // 0=dom ... 6=sáb
            const currentHour = nowCL.getHours();
            const currentMinute = nowCL.getMinutes();
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

            console.log(`📅 Hoy en Chile: index=${todayIndex} (${daysOfWeek[todayIndex]}), ${nowCL.toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`);
            console.log(`⏰ Hora actual Chile: ${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);

            // ====== CÁLCULO RANGO HOY CHILE COMO UTC PARA MONGO ======
            const serverNow = new Date(); // hora del servidor (zona del servidor)
            const clNow = new Date(serverNow.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
            const tzDiffMs = serverNow.getTime() - clNow.getTime(); // diferencia servidor vs Chile

            console.log('🧭 serverNow:', fmt(serverNow));
            console.log('🧭 clNow (derivado de serverNow):', fmt(clNow));
            console.log('🔁 tzDiffMs (serverNow - clNow):', tzDiffMs, 'ms (~', (tzDiffMs / 3600000).toFixed(2), 'h )');

            const y = clNow.getFullYear(), m = clNow.getMonth(), d = clNow.getDate();
            const startCLLocal = new Date(y, m, d, 0, 0, 0, 0);
            const endCLLocal = new Date(y, m, d, 23, 59, 59, 999);
            const todayStartUTC = new Date(startCLLocal.getTime() + tzDiffMs);
            const todayEndUTC = new Date(endCLLocal.getTime() + tzDiffMs);

            console.log('📦 startCLLocal:', fmt(startCLLocal));
            console.log('📦 endCLLocal  :', fmt(endCLLocal));
            console.log('🌐 todayStartUTC (para Mongo $gte):', fmt(todayStartUTC));
            console.log('🌐 todayEndUTC   (para Mongo $lte):', fmt(todayEndUTC));

            // ====== CUENTA PEDIDOS HOY ======
            const todayOrdersCount = await Order.countDocuments({
                storeId,
                status: { $nin: ['cancelado'] },
                deliveryDate: { $gte: todayStartUTC, $lte: todayEndUTC }
            });

            const BLOCK_TODAY_THRESHOLD = 10;
            const shouldBlockToday = todayOrdersCount > BLOCK_TODAY_THRESHOLD;

            console.log(`🧮 Pedidos HOY (Chile): ${todayOrdersCount} | Umbral=${BLOCK_TODAY_THRESHOLD} | shouldBlockToday=${shouldBlockToday}`);

            const filterSchedule = (schedule) => {
                const filtered = {};

                // Recalcular “ahora” en Chile dentro de la función
                const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

                console.log('🧩 Filtrando horarios desde (Chile):', now.toLocaleString('es-CL', { timeZone: 'America/Santiago' }));

                let foundDays = 0;
                let offset = 0;

                while (foundDays < 4 && offset < 14) {
                    const date = new Date(now);
                    date.setDate(now.getDate() + offset);

                    const index = date.getDay(); // 0-6
                    const dayKey = daysOfWeek[index];
                    const dayConfig = schedule[dayKey];

                    console.log(`\n📅 Día offset=${offset} => ${dayKey} (${date.toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })})`);

                    if (!dayConfig?.enabled || !dayConfig?.hours) {
                        console.log('  ⛔ Día deshabilitado o sin horas');
                        offset++;
                        continue;
                    }

                    if (offset === 0 && shouldBlockToday) {
                        console.log('  🚫 HOY bloqueado por capacidad (shouldBlockToday=true)');
                        offset++;
                        continue;
                    }

                    const validHours = {};
                    Object.entries(dayConfig.hours).forEach(([hourStr, isActive]) => {
                        if (!isActive) return;
                        const [hour, minute] = hourStr.split(':').map(Number);

                        if (offset === 0) {
                            const passed = hour < currentHour || (hour === currentHour && minute <= currentMinute);
                            if (passed) {
                                console.log(`  ⏭️  Descartando hora pasada HOY: ${hourStr} (ahora=${currentHour}:${String(currentMinute).padStart(2, '0')})`);
                                return;
                            }
                        }
                        validHours[hourStr] = true;
                    });

                    if (Object.keys(validHours).length > 0) {
                        console.log('  ✅ Horas disponibles para', dayKey, ':', Object.keys(validHours));
                        filtered[dayKey] = { enabled: true, hours: validHours };
                        foundDays++;
                    } else {
                        console.log('  ❗ Sin horas válidas después del filtro');
                    }

                    offset++;
                }

                console.log('📤 Horarios filtrados (para frontend):', JSON.stringify(filtered, null, 2));
                return filtered;
            };

            const formattedZones = zones.map(zone => ({
                deliveryCost: zone.deliveryCost,
                schedule: filterSchedule(zone.schedule),
            }));

            return {
                success: true,
                message: 'Datos de tienda obtenidos correctamente',
                data: {
                    paymentMethods: store.paymentmethod,
                    deliveryZones: formattedZones,
                },
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener datos de tienda:', error);
            return { success: false, message: 'Error inesperado al obtener datos de tienda' };
        }
    };







}
