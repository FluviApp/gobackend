// services/store/StoreOrdersByDeliveredMonth.service.js
import { DateTime } from 'luxon';
import connectMongoDB from '../../libs/mongoose.js';
import Order from '../../models/Orders.js';

const TZ = 'America/Santiago';

function parseLocalToUTC(dateStr, endOfDay = false) {
    if (!dateStr) return null;
    let dt = DateTime.fromISO(dateStr, { zone: TZ });
    if (!dt.isValid) dt = DateTime.fromFormat(dateStr, 'dd/MM/yyyy', { zone: TZ });
    if (!dt.isValid) return null;
    dt = endOfDay ? dt.endOf('day') : dt.startOf('day');
    return dt.toUTC().toJSDate();
}

export default class StoreOrdersByDeliveredMonthService {
    constructor() { connectMongoDB(); }

    /**
     * Lista TODAS las órdenes del MES por deliveredAt
     * y paymentMethod **fijo** = 'transferencia'.
     *
     * Params:
     *  - storeId (req, string)
     *  - startDate/endDate (opt, 'YYYY-MM-DD' o 'DD/MM/YYYY')
     *    si no vienen → mes actual en America/Santiago
     */
    async listByDeliveredMonth({ storeId, startDate, endDate }) {
        try {
            if (!storeId) return { success: false, message: 'storeId es requerido' };

            const nowCL = DateTime.now().setZone(TZ);
            const startUTC = parseLocalToUTC(startDate, false) ?? nowCL.startOf('month').toUTC().toJSDate();
            const endUTC = parseLocalToUTC(endDate, true) ?? nowCL.endOf('month').toUTC().toJSDate();

            if (startUTC > endUTC) {
                return { success: false, message: 'Rango inválido: startDate > endDate' };
            }

            const query = {
                storeId: String(storeId),                       // en tu modelo es String
                paymentMethod: 'transferencia',                 // ← EN DURO
                deliveredAt: { $gte: startUTC, $lte: endUTC },  // referencia de fechas
            };

            const orders = await Order.find(query)
                .sort({ deliveredAt: 1, _id: 1 })
                .lean();

            const totals = orders.reduce(
                (acc, o) => {
                    acc.count += 1;
                    acc.totalCLP += Number(o.finalPrice ?? o.price ?? 0);
                    return acc;
                },
                { count: 0, totalCLP: 0 }
            );

            return {
                success: true,
                message: 'Órdenes por deliveredAt (transferencia) del mes listadas correctamente',
                data: {
                    storeId: String(storeId),
                    range: { startUTC, endUTC, timezone: TZ },
                    dateField: 'deliveredAt',
                    paymentMethod: 'transferencia',
                    orders,
                    totals,
                },
            };
        } catch (e) {
            console.error('❌ listByDeliveredMonth (transferencia):', e);
            return { success: false, message: 'Error al listar órdenes por deliveredAt (transferencia)', error: String(e?.message || e) };
        }
    }
}
