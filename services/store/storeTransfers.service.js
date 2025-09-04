import { DateTime } from 'luxon';
import connectMongoDB from '../../libs/mongoose.js';
import Order from '../../models/Orders.js';

const TZ = 'America/Santiago';

export default class StoreTransfersService {
    constructor() { connectMongoDB(); }

    // Acepta 'YYYY-MM-DD' o 'DD/MM/YYYY'
    parseLocalDate(dateStr, endOfDay = false) {
        if (!dateStr) return null;
        let dt = DateTime.fromISO(dateStr, { zone: TZ });
        if (!dt.isValid) dt = DateTime.fromFormat(dateStr, 'dd/MM/yyyy', { zone: TZ });
        if (!dt.isValid) return null;
        dt = endOfDay ? dt.endOf('day') : dt.startOf('day');
        return dt.toUTC().toJSDate();
    }

    async getTransfersMonth({ storeId, startDate, endDate, paymentMethod }) {
        try {
            if (!storeId) return { success: false, message: 'storeId es requerido' };

            const nowCL = DateTime.now().setZone(TZ);
            const startUTC = this.parseLocalDate(startDate, false) ?? nowCL.startOf('month').toUTC().toJSDate();
            const endUTC = this.parseLocalDate(endDate, true) ?? nowCL.endOf('month').toUTC().toJSDate();

            const storeIdStr = String(storeId);
            const method = (paymentMethod && String(paymentMethod).trim()) || 'transferencia';

            const pipeline = [
                {
                    $match: {
                        storeId: storeIdStr,
                        status: { $nin: ['cancelado', 'CANCELADO', 'cancelled'] },
                        deliveryDate: { $gte: startUTC, $lte: endUTC },
                        paymentMethod: method,
                    }
                },
                {
                    $project: {
                        finalPrice: { $ifNull: ['$finalPrice', 0] },
                        day: { $dateToString: { date: '$deliveryDate', format: '%Y-%m-%d', timezone: TZ } }
                    }
                },
                {
                    $facet: {
                        rows: [
                            { $group: { _id: '$day', count: { $sum: 1 }, totalCLP: { $sum: '$finalPrice' } } },
                            { $project: { _id: 0, day: '$_id', count: 1, totalCLP: 1 } },
                            { $sort: { day: 1 } }
                        ],
                        totals: [
                            { $group: { _id: null, count: { $sum: 1 }, totalCLP: { $sum: '$finalPrice' } } },
                            { $project: { _id: 0, count: 1, totalCLP: 1 } }
                        ]
                    }
                }
            ];

            const [agg] = await Order.aggregate(pipeline);
            const rows = agg?.rows ?? [];
            const totals = agg?.totals?.[0] ?? { count: 0, totalCLP: 0 };

            return {
                success: true,
                message: 'Reporte transfersmonth generado correctamente',
                data: {
                    storeId: storeIdStr,
                    range: { startUTC, endUTC, timezone: TZ },
                    paymentMethod: method,
                    rows,      // [{ day: '2025-09-04', count: 3, totalCLP: 15000 }, ...]
                    totals,    // { count: X, totalCLP: Y }
                }
            };
        } catch (error) {
            console.error('❌ Servicio - Error en transfersmonth:', error);
            return { success: false, message: 'Error al generar transfersmonth' };
        }
    }
}
