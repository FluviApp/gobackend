import { DateTime } from 'luxon';
import connectMongoDB from '../../libs/mongoose.js';
import Order from '../../models/Orders.js'; // <-- ajusta esta ruta/archivo si es distinto

const TZ = 'America/Santiago';

export default class StoreTransfersService {
    constructor() {
        connectMongoDB();
    }

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

            // 👉 Devolvemos CADA pedido (no agregados)
            const orders = await Order.aggregate([
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
                        orderId: '$_id',
                        deliveryDate: 1,
                        // Fecha y hora locales derivadas de deliveryDate (para mostrar en tabla)
                        day: { $dateToString: { date: '$deliveryDate', format: '%Y-%m-%d', timezone: TZ } },
                        time: { $dateToString: { date: '$deliveryDate', format: '%H:%M', timezone: TZ } },

                        // Monto
                        finalPrice: { $ifNull: ['$finalPrice', 0] },

                        // Info útil para la tabla
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
                    }
                },
                { $sort: { day: 1, time: 1, orderId: 1 } }
            ]);

            // Totales (por si te sirven para un footer)
            const totals = orders.reduce(
                (acc, o) => {
                    acc.count += 1;
                    acc.totalCLP += Number(o.finalPrice || 0);
                    return acc;
                },
                { count: 0, totalCLP: 0 }
            );

            return {
                success: true,
                message: 'Listado de pedidos generado correctamente',
                data: {
                    storeId: storeIdStr,
                    range: { startUTC, endUTC, timezone: TZ },
                    paymentMethod: method,
                    orders,   // 👈 aquí viene la lista ordenada por fecha/hora
                    totals,   // opcional para footer
                }
            };
        } catch (error) {
            console.error('❌ Servicio - Error en transfersmonth (detalle):', error);
            return { success: false, message: 'Error al generar transfersmonth (detalle)' };
        }
    }
}
