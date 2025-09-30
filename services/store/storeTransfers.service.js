// Services/store/StoreTransfers.service.js
import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import connectMongoDB from '../../libs/mongoose.js';
import Order from '../../models/Orders.js';

const TZ = 'America/Santiago';
const { ObjectId } = mongoose.Types;

export default class StoreTransfersService {
    constructor() { connectMongoDB(); }

    // Acepta 'YYYY-MM-DD' o 'DD/MM/YYYY'; respeta TZ y convierte a UTC
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

    /**
     * Todos los pedidos del mes con pago por transferencia.
     * Si no envías fechas, usa el mes actual (TZ America/Santiago).
     * Params:
     *  - storeId (obligatorio)
     *  - startDate/endDate (opcional 'YYYY-MM-DD' o 'DD/MM/YYYY')
     */
    async getTransfersMonth({ storeId, startDate, endDate }) {
        try {
            if (!storeId) return { success: false, message: 'storeId es requerido' };

            const nowCL = DateTime.now().setZone(TZ);
            const startUTC = this.toUTC(startDate, false) ?? nowCL.startOf('month').toUTC().toJSDate();
            const endUTC = this.toUTC(endDate, true) ?? nowCL.endOf('month').toUTC().toJSDate();

            if (startUTC > endUTC) {
                return { success: false, message: 'El rango de fechas es inválido (start > end)' };
            }

            const storeIdFilter = this.castStoreId(storeId);

            // Solo transferencia (case-insensitive exacta)
            const paymentMethodFilter = { $regex: /^transferencia$/i };

            const match = {
                storeId: storeIdFilter,
                paymentMethod: paymentMethodFilter,
                status: { $nin: ['cancelado', 'CANCELADO', 'cancelled', 'CANCELED'] },
                $or: [
                    { deliveryDate: { $gte: startUTC, $lte: endUTC } },
                    { createdAt: { $gte: startUTC, $lte: endUTC } },
                ],
            };

            const pipeline = [
                { $match: match },
                {
                    $project: {
                        orderId: '$_id',
                        baseDate: { $ifNull: ['$deliveryDate', '$createdAt'] },
                        day: { $dateToString: { date: { $ifNull: ['$deliveryDate', '$createdAt'] }, format: '%Y-%m-%d', timezone: TZ } },
                        time: { $dateToString: { date: { $ifNull: ['$deliveryDate', '$createdAt'] }, format: '%H:%M', timezone: TZ } },
                        finalPrice: { $ifNull: ['$finalPrice', 0] },
                        paymentMethod: 1,
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
