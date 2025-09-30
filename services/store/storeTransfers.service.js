// Services/store/StoreTransfers.service.js
import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import connectMongoDB from '../../libs/mongoose.js';
import Order from '../../models/Orders.js';

const TZ = 'America/Santiago';
const { ObjectId } = mongoose.Types;

export default class StoreTransfersService {
    constructor() { connectMongoDB(); }

    // 'YYYY-MM-DD' o 'DD/MM/YYYY' -> Date UTC respetando TZ y DST
    toUTC(dateStr, endOfDay = false) {
        if (!dateStr) return null;
        let dt = DateTime.fromISO(dateStr, { zone: TZ });
        if (!dt.isValid) dt = DateTime.fromFormat(dateStr, 'dd/MM/yyyy', { zone: TZ });
        if (!dt.isValid) return null;
        dt = endOfDay ? dt.endOf('day') : dt.startOf('day');
        return dt.toUTC().toJSDate();
    }

    castStoreId(storeId) {
        const s = String(storeId);
        return ObjectId.isValid(s) ? new ObjectId(s) : s;
    }

    // 🔥 Fix borde fin de mes: start(1/oct) - 1ms en TZ
    monthEndInclusive({ year, month }) {
        const startNext = DateTime.fromObject({ year, month, day: 1 }, { zone: TZ })
            .plus({ months: 1 })
            .startOf('month');
        return startNext.minus({ milliseconds: 1 }).toUTC().toJSDate();
    }

    async getTransfersMonth({ storeId, startDate, endDate }) {
        try {
            if (!storeId) return { success: false, message: 'storeId es requerido' };

            const nowCL = DateTime.now().setZone(TZ);
            const startUTC =
                this.toUTC(startDate, false) ??
                nowCL.startOf('month').toUTC().toJSDate();

            // si no viene endDate, usamos “inicio del 1/mes siguiente - 1ms”
            const endUTC =
                this.toUTC(endDate, true) ??
                this.monthEndInclusive({ year: nowCL.year, month: nowCL.month });

            if (startUTC > endUTC) {
                return { success: false, message: 'El rango de fechas es inválido (start > end)' };
            }

            const storeIdFilter = this.castStoreId(storeId);

            // ✅ Cualquier indicador de transferencia
            const transferFilter = {
                $or: [
                    { paymentMethod: { $regex: /^transferencia$/i } },
                    { transferPay: true },
                ]
            };

            // ✅ Usar la fecha que exista (deliveryDate || createdAt || deliveredAt)
            const dateWindow = { $gte: startUTC, $lte: endUTC };
            const dateFilter = {
                $or: [
                    { deliveryDate: dateWindow },
                    { createdAt: dateWindow },
                    { deliveredAt: dateWindow },
                ]
            };

            // Excluimos cancelados, el resto entra (incluye 'entregado')
            const match = {
                storeId: storeIdFilter,
                status: { $nin: ['cancelado', 'CANCELADO', 'cancelled', 'CANCELED'] },
                ...transferFilter,
                ...dateFilter,
            };

            const pipeline = [
                { $match: match },
                {
                    $addFields: {
                        _baseDate: {
                            $ifNull: ['$deliveryDate',
                                { $ifNull: ['$createdAt', '$deliveredAt'] }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        orderId: '$_id',
                        baseDate: '$_baseDate',
                        day: { $dateToString: { date: '$_baseDate', format: '%Y-%m-%d', timezone: TZ } },
                        time: { $dateToString: { date: '$_baseDate', format: '%H:%M', timezone: TZ } },
                        finalPrice: { $ifNull: ['$finalPrice', 0] },
                        paymentMethod: 1,
                        transferPay: 1,
                        status: 1,
                        origin: 1,
                        deliveryType: 1,
                        deliveryHour: '$deliverySchedule.hour',
                        customer: {
                            name: '$customer.name',
                            phone: '$customer.phone',
                            address: '$customer.address',
                            block: { $ifNull: ['$customer.block', '$customer.deptoblock'] },
                        },
                        deliveryPerson: '$deliveryPerson.name',
                        deliveryDate: 1,
                        createdAt: 1,
                        deliveredAt: 1,
                    }
                },
                { $sort: { day: 1, time: 1, orderId: 1 } }
            ];

            const orders = await Order.aggregate(pipeline);

            const totals = orders.reduce(
                (acc, o) => { acc.count += 1; acc.totalCLP += Number(o.finalPrice || 0); return acc; },
                { count: 0, totalCLP: 0 }
            );

            return {
                success: true,
                message: 'Pedidos por transferencia del mes generados correctamente',
                data: {
                    storeId: String(storeId),
                    range: { startUTC, endUTC, timezone: TZ },
                    paymentMethod: 'transferencia',
                    orders,
                    totals,
                }
            };
        } catch (err) {
            console.error('❌ transfersmonth (transferencia):', err);
            return { success: false, message: 'Error al obtener pedidos por transferencia del mes' };
        }
    }
}
