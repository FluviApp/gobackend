// services/store/StoreOrdersByMonth.service.js
import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import connectMongoDB from '../../libs/mongoose.js';
import Order from '../../models/Orders.js';

const TZ = 'America/Santiago';
const { ObjectId } = mongoose.Types;

function castStoreIdFlexible(id) {
    const s = String(id);
    return ObjectId.isValid(s) ? { $in: [new ObjectId(s), s] } : s;
}

function parseLocalToUTC(dateStr, endOfDay = false) {
    if (!dateStr) return null;
    let dt = DateTime.fromISO(dateStr, { zone: TZ });
    if (!dt.isValid) dt = DateTime.fromFormat(dateStr, 'dd/MM/yyyy', { zone: TZ });
    if (!dt.isValid) return null;
    dt = endOfDay ? dt.endOf('day') : dt.startOf('day');
    return dt.toUTC().toJSDate();
}

// fin de mes inclusivo: inicio del mes siguiente en CL - 1ms
function monthEndInclusive(dtCL) {
    const startNext = dtCL.plus({ months: 1 }).startOf('month');
    return startNext.minus({ milliseconds: 1 }).toUTC().toJSDate();
}

export default class StoreOrdersByMonthService {
    constructor() { connectMongoDB(); }

    /**
     * Lista TODAS las órdenes del MES para un storeId.
     * Params:
     *  - storeId (req)
     *  - startDate/endDate (opcional, 'YYYY-MM-DD' o 'DD/MM/YYYY')
     *  - dateField (opcional) => 'createdAt' | 'deliveryDate' | 'deliveredAt' (default: 'createdAt')
     */
    async listByStoreMonth({ storeId, startDate, endDate, dateField = 'createdAt' }) {
        try {
            if (!storeId) return { success: false, message: 'storeId es requerido' };

            const nowCL = DateTime.now().setZone(TZ);
            const startUTC = parseLocalToUTC(startDate, false) ?? nowCL.startOf('month').toUTC().toJSDate();
            const endUTC = parseLocalToUTC(endDate, true) ?? monthEndInclusive(nowCL);

            if (startUTC > endUTC) {
                return { success: false, message: 'Rango inválido: startDate > endDate' };
            }

            const storeFilter = castStoreIdFlexible(storeId);

            const query = {
                storeId: storeFilter,
                [dateField]: { $gte: startUTC, $lte: endUTC },
            };

            const orders = await Order.find(query)
                .sort({ [dateField]: 1, _id: 1 })
                .select({
                    _id: 1,
                    storeId: 1,
                    origin: 1,
                    paymentMethod: 1,
                    transferPay: 1,
                    status: 1,
                    deliveryType: 1,
                    finalPrice: 1,
                    price: 1,
                    products: 1,
                    customer: 1,
                    deliveryPerson: 1,
                    deliveryDate: 1,
                    deliveredAt: 1,
                    createdAt: 1,
                    updatedAt: 1,
                })
                .lean();

            const totals = orders.reduce(
                (acc, o) => {
                    acc.count += 1;
                    acc.totalCLP += Number(o?.finalPrice ?? o?.price ?? 0);
                    return acc;
                },
                { count: 0, totalCLP: 0 }
            );

            return {
                success: true,
                message: 'Órdenes del mes listadas correctamente',
                data: {
                    storeId: String(storeId),
                    dateField,
                    range: { startUTC, endUTC, timezone: TZ },
                    orders,
                    totals,
                }
            };
        } catch (err) {
            console.error('❌ listByStoreMonth error:', err);
            return { success: false, message: 'Error al listar órdenes del mes por storeId' };
        }
    }
}
