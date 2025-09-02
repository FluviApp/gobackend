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



    // getStoreData = async (storeId, coords = {}) => {
    //     const TZ = 'America/Santiago';

    //     try {
    //         const store = await Stores.findOne({ _id: storeId }).lean();
    //         if (!store) return { success: false, message: 'Tienda no encontrada' };

    //         const zones = await Zones.find({ storeId }).lean();
    //         if (!zones || zones.length === 0) {
    //             return { success: false, message: 'Zonas de entrega no encontradas' };
    //         }

    //         // --- Coordenadas opcionales
    //         const latNum = coords && coords.lat != null ? Number(coords.lat) : null;
    //         const lonNum = coords && coords.lon != null ? Number(coords.lon) : null;
    //         const hasPoint = Number.isFinite(latNum) && Number.isFinite(lonNum);

    //         const zoneContainsPoint = (zone, plat, plon) => {
    //             const poly = Array.isArray(zone?.polygon) ? zone.polygon : null;
    //             if (!poly || poly.length < 3) return false;
    //             let inside = false;
    //             for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    //                 const xi = Number(poly[i]?.lng), yi = Number(poly[i]?.lat);
    //                 const xj = Number(poly[j]?.lng), yj = Number(poly[j]?.lat);
    //                 if (!Number.isFinite(xi) || !Number.isFinite(yi) || !Number.isFinite(xj) || !Number.isFinite(yj)) continue;
    //                 const intersect = ((yi > plat) !== (yj > plat)) &&
    //                     (plon < ((xj - xi) * (plat - yi)) / ((yj - yi) || 1e-12) + xi);
    //                 if (intersect) inside = !inside;
    //             }
    //             return inside;
    //         };

    //         // --- AHORA en Chile con Luxon
    //         const nowCL = DateTime.now().setZone(TZ);

    //         // --- Rango hoy Chile en UTC para Mongo
    //         const startCL = nowCL.startOf('day');
    //         const endCL = nowCL.endOf('day');
    //         const todayStartUTC = startCL.toUTC().toJSDate();
    //         const todayEndUTC = endCL.toUTC().toJSDate();

    //         // --- Conteo pedidos hoy
    //         const todayOrdersCount = await Order.countDocuments({
    //             storeId,
    //             status: { $nin: ['cancelado'] },
    //             deliveryDate: { $gte: todayStartUTC, $lte: todayEndUTC }
    //         });

    //         const BLOCK_TODAY_THRESHOLD = 10;
    //         const shouldBlockToday = todayOrdersCount > BLOCK_TODAY_THRESHOLD;

    //         // --- Helper: filtrar próximos 4 días, devolviendo MISMO SHAPE (schedule)
    //         const filterSchedule = (schedule) => {
    //             const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    //             const filtered = {}; // <- MISMO SHAPE QUE ESPERA EL FRONT
    //             let foundDays = 0;
    //             let offset = 0;

    //             while (foundDays < 4 && offset < 14) {
    //                 const dateCL = nowCL.plus({ days: offset }).startOf('day'); // fecha exacta en Chile
    //                 const index = dateCL.weekday % 7; // Luxon: 1..7 (Dom=7) -> 0..6 con %7
    //                 const dayKey = daysOfWeek[index];
    //                 const dayConfig = schedule?.[dayKey];

    //                 if (!dayConfig?.enabled || !dayConfig?.hours) {
    //                     offset++;
    //                     continue;
    //                 }

    //                 // Si es HOY y está bloqueado por capacidad, saltar el día completo
    //                 if (offset === 0 && shouldBlockToday) {
    //                     offset++;
    //                     continue;
    //                 }

    //                 const validHours = {};
    //                 for (const [hhmm, isActive] of Object.entries(dayConfig.hours)) {
    //                     if (!isActive) continue;

    //                     // Construye el DateTime del slot en Chile
    //                     const [hh, mm] = hhmm.split(':').map(Number);
    //                     const slotCL = dateCL.set({ hour: hh, minute: mm, second: 0, millisecond: 0 });

    //                     // Si es hoy, descartar horas ya pasadas
    //                     if (offset === 0 && slotCL <= nowCL) continue;

    //                     validHours[hhmm] = true;
    //                 }

    //                 // Solo incorporar el día si quedó al menos una hora válida
    //                 if (Object.keys(validHours).length > 0) {
    //                     filtered[dayKey] = { enabled: true, hours: validHours };
    //                     foundDays++;
    //                 }

    //                 offset++;
    //             }

    //             return filtered;
    //         };

    //         // --- Si hay coordenadas y una zona contiene el punto, usar esa sola
    //         let zonesToFormat = zones;
    //         if (hasPoint) {
    //             const matched = zones.find(z => zoneContainsPoint(z, latNum, lonNum));
    //             if (matched) zonesToFormat = [matched];
    //         }

    //         // --- Formato final: cada zona con schedule (MISMO SHAPE)
    //         const formattedZones = zonesToFormat.map(zone => ({
    //             deliveryCost: zone.deliveryCost,
    //             schedule: filterSchedule(zone.schedule) // <- igual que antes
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
    //         return { success: false, message: 'Error inesperado al obtener datos de tienda' };
    //     }
    // };




    // Asume que tienes importados tus modelos Stores, Zones y Order.
    // Asegúrate también de tener instalado luxon: npm i luxon

    getStoreData = async (storeId, coords = {}) => {
        const TZ = 'America/Santiago';
        const BLOCK_TODAY_THRESHOLD = 10; // bloquea el día completo desde 10 pedidos

        try {
            // --- Buscar tienda
            const store = await Stores.findOne({ _id: storeId }).lean();
            if (!store) {
                return { success: false, message: 'Tienda no encontrada' };
            }

            // --- Zonas de entrega
            const zones = await Zones.find(
                { storeId },
                { deliveryCost: 1, schedule: 1, polygon: 1 }
            ).lean();

            if (!zones || zones.length === 0) {
                return { success: false, message: 'Zonas de entrega no encontradas' };
            }

            // --- Coordenadas opcionales
            const latNum = coords?.lat != null ? Number(coords.lat) : null;
            const lonNum = coords?.lon != null ? Number(coords.lon) : null;
            const hasPoint = Number.isFinite(latNum) && Number.isFinite(lonNum);

            // --- Punto en polígono (ray casting)
            const zoneContainsPoint = (zone, plat, plon) => {
                const poly = Array.isArray(zone?.polygon) ? zone.polygon : null;
                if (!poly || poly.length < 3) return false;
                let inside = false;
                for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                    const xi = Number(poly[i]?.lng), yi = Number(poly[i]?.lat);
                    const xj = Number(poly[j]?.lng), yj = Number(poly[j]?.lat);
                    if (
                        !Number.isFinite(xi) || !Number.isFinite(yi) ||
                        !Number.isFinite(xj) || !Number.isFinite(yj)
                    ) continue;
                    const intersect = ((yi > plat) !== (yj > plat)) &&
                        (plon < ((xj - xi) * (plat - yi)) / ((yj - yi) || 1e-12) + xi);
                    if (intersect) inside = !inside;
                }
                return inside;
            };

            // --- Tiempo en Chile
            const nowCL = DateTime.now().setZone(TZ);

            // --- Rango HOY (CLT) en UTC para Mongo
            const todayStartUTC = nowCL.startOf('day').toUTC().toJSDate();
            const todayEndUTC = nowCL.endOf('day').toUTC().toJSDate();

            // --- Conteo pedidos HOY (¡OJO! storeId en Order es String)
            const storeIdStr = String(storeId);
            const todayOrdersCount = await Order.countDocuments({
                storeId: storeIdStr,
                status: { $nin: ['cancelado', 'CANCELADO', 'cancelled'] },
                deliveryDate: { $gte: todayStartUTC, $lte: todayEndUTC },
            });

            const shouldBlockToday = todayOrdersCount >= BLOCK_TODAY_THRESHOLD;

            // --- Helper normalizador de HH:mm
            const toHHmm = (hh, mm) =>
                `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

            // --- Filtrar próximos 4 días, manteniendo MISMO SHAPE (schedule)
            const filterSchedule = (schedule) => {
                const daysOfWeek = [
                    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
                ];
                const filtered = {};
                let foundDays = 0;
                let offset = 0;

                // Para HOY: ocultar hora actual y la siguiente
                const currentHour = nowCL.hour;
                const nextHour = (currentHour + 1) % 24;

                while (foundDays < 4 && offset < 14) {
                    const dateCL = nowCL.plus({ days: offset }).startOf('day');
                    const index = dateCL.weekday % 7; // Luxon 1..7 -> 0..6
                    const dayKey = daysOfWeek[index];
                    const dayConfig = schedule?.[dayKey];

                    if (!dayConfig?.enabled || !dayConfig?.hours) {
                        offset++;
                        continue;
                    }

                    // Si HOY alcanzó el tope, saltar el día completo
                    if (offset === 0 && shouldBlockToday) {
                        offset++;
                        continue;
                    }

                    const validHours = {};
                    for (const [rawKey, isActive] of Object.entries(dayConfig.hours)) {
                        if (!isActive) continue;

                        const [rawH = '0', rawM = '0'] = String(rawKey).split(':');
                        const hh = Number(rawH);
                        const mm = Number(rawM);
                        if (!Number.isFinite(hh) || !Number.isFinite(mm)) continue;

                        const slotCL = dateCL.set({ hour: hh, minute: mm, second: 0, millisecond: 0 });

                        if (offset === 0) {
                            // Ocultar bloques de la hora actual y la siguiente
                            if (hh === currentHour || hh === nextHour) continue;
                            // No mostrar horas pasadas
                            if (slotCL <= nowCL) continue;
                        }

                        validHours[toHHmm(hh, mm)] = true;
                    }

                    if (Object.keys(validHours).length > 0) {
                        filtered[dayKey] = { enabled: true, hours: validHours };
                        foundDays++;
                    }

                    offset++;
                }

                return filtered;
            };

            // --- Si hay coordenadas, prioriza zona que contenga el punto (la más barata si hay varias)
            let zonesToFormat = zones;
            if (hasPoint) {
                const matches = zones.filter(z => zoneContainsPoint(z, latNum, lonNum));
                if (matches.length > 0) {
                    matches.sort((a, b) => (a.deliveryCost ?? 0) - (b.deliveryCost ?? 0));
                    zonesToFormat = [matches[0]];
                }
            }

            // --- Formato final: cada zona con schedule filtrado
            const formattedZones = zonesToFormat.map(zone => ({
                deliveryCost: zone.deliveryCost ?? 0,
                schedule: filterSchedule(zone.schedule || {}),
            }));

            return {
                success: true,
                message: 'Datos de tienda obtenidos correctamente',
                data: {
                    paymentMethods: Array.isArray(store.paymentMethods)
                        ? store.paymentMethods
                        : (store.paymentmethod ?? []), // fallback si tu campo es singular
                    deliveryZones: formattedZones,
                },
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener datos de tienda:', error);
            return { success: false, message: 'Error inesperado al obtener datos de tienda' };
        }
    };






}
