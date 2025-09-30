import connectMongoDB from '../../libs/mongoose.js';
import Order from '../../models/Orders.js';

// Parser muy simple: YYYY-MM-DD o DD/MM/YYYY -> Date UTC al inicio/fin del día
function parseDateFlexible(dateStr, endOfDay = false) {
    if (!dateStr || typeof dateStr !== 'string') return null;

    // YYYY-MM-DD
    let m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
        const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
        return new Date(Date.UTC(y, mo - 1, d, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0));
    }

    // DD/MM/YYYY
    m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
        const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
        return new Date(Date.UTC(y, mo - 1, d, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0));
    }

    return null;
}

export default class StoreTransfersService {
    constructor() { connectMongoDB(); }

    // === EXISTENTE ===
    async getTransfersMonth({ storeId, startDate, endDate, paymentMethod = 'transferencia' }) {
        try {
            if (!storeId) return { success: false, message: 'storeId es requerido' };

            const now = new Date();
            const startDefault = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
            const endDefault = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

            const startUTC = parseDateFlexible(startDate, false) ?? startDefault;
            const endUTC = parseDateFlexible(endDate, true) ?? endDefault;

            if (isNaN(startUTC) || isNaN(endUTC)) {
                return { success: false, message: 'Fechas inválidas: usa YYYY-MM-DD o DD/MM/YYYY' };
            }
            if (startUTC > endUTC) {
                return { success: false, message: 'Rango inválido: startDate > endDate' };
            }

            const query = {
                storeId: String(storeId),                 // en tu schema es String
                paymentMethod: String(paymentMethod),     // 'transferencia'
                createdAt: { $gte: startUTC, $lte: endUTC },
            };

            const orders = await Order.find(query).sort({ createdAt: 1, _id: 1 }).lean();

            const totals = orders.reduce((acc, o) => {
                acc.count += 1;
                acc.totalCLP += Number(o.finalPrice ?? o.price ?? 0);
                return acc;
            }, { count: 0, totalCLP: 0 });

            return {
                success: true,
                message: 'Pedidos por transferencia del mes generados correctamente',
                data: {
                    storeId: String(storeId),
                    range: { startUTC, endUTC, timezone: 'UTC' },
                    paymentMethod: String(paymentMethod),
                    orders,
                    totals,
                }
            };
        } catch (error) {
            console.error('❌ Servicio - transfersmonth:', error);
            return { success: false, message: 'Error al generar transfersmonth', error: String(error?.message || error) };
        }
    }

    // === NUEVO ===  -> EXACTO a tu pedido: mes actual por deliveredAt
    async listByDeliveredMonth({ storeId, startDate, endDate }) {
        try {
            if (!storeId) return { success: false, message: 'storeId es requerido' };

            const now = new Date();
            const startDefault = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
            const endDefault = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

            const startUTC = parseDateFlexible(startDate, false) ?? startDefault;
            const endUTC = parseDateFlexible(endDate, true) ?? endDefault;

            if (isNaN(startUTC) || isNaN(endUTC)) {
                return { success: false, message: 'Fechas inválidas: usa YYYY-MM-DD o DD/MM/YYYY' };
            }
            if (startUTC > endUTC) {
                return { success: false, message: 'Rango inválido: startDate > endDate' };
            }

            const query = {
                storeId: String(storeId),                          // String según tu schema
                deliveredAt: { $gte: startUTC, $lte: endUTC },     // 🔥 referencia pedida
            };

            const orders = await Order.find(query)
                .sort({ deliveredAt: 1, _id: 1 })
                .lean();

            const totals = orders.reduce((acc, o) => {
                acc.count += 1;
                acc.totalCLP += Number(o.finalPrice ?? o.price ?? 0);
                return acc;
            }, { count: 0, totalCLP: 0 });

            return {
                success: true,
                message: 'Órdenes (deliveredAt) del mes listadas correctamente',
                data: {
                    storeId: String(storeId),
                    dateField: 'deliveredAt',
                    range: { startUTC, endUTC, timezone: 'UTC' },
                    orders,
                    totals,
                }
            };
        } catch (error) {
            console.error('❌ Servicio - listByDeliveredMonth:', error);
            return { success: false, message: 'Error al listar órdenes por deliveredAt', error: String(error?.message || error) };
        }
    }
}
