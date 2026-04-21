import connectMongoDB from '../../libs/mongoose.js';
import Stores from '../../models/Stores.js';

export default class StoreDeliveryConfigService {
    constructor() {
        connectMongoDB();
    }

    getDeliveryConfig = async ({ storeId }) => {
        try {
            if (!storeId) {
                return { success: false, message: 'storeId es requerido' };
            }

            const store = await Stores.findById(storeId, {
                deliverOnHolidays: 1,
                blockedDates: 1,
            }).lean();

            if (!store) {
                return { success: false, message: 'Tienda no encontrada' };
            }

            return {
                success: true,
                message: 'Configuración obtenida correctamente',
                data: {
                    deliverOnHolidays: store.deliverOnHolidays !== false,
                    blockedDates: (store.blockedDates || []).map((d) => new Date(d).toISOString()),
                },
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener config de reparto:', error);
            return { success: false, message: 'Error al obtener configuración' };
        }
    };

    updateDeliveryConfig = async ({ storeId, deliverOnHolidays, blockedDates }) => {
        try {
            if (!storeId) {
                return { success: false, message: 'storeId es requerido' };
            }

            const update = {};
            if (deliverOnHolidays !== undefined) {
                update.deliverOnHolidays = deliverOnHolidays === true || deliverOnHolidays === 'true';
            }
            if (blockedDates !== undefined) {
                if (!Array.isArray(blockedDates)) {
                    return { success: false, message: 'blockedDates debe ser un array' };
                }
                const parsed = blockedDates
                    .map((d) => {
                        const dt = new Date(d);
                        if (isNaN(dt.getTime())) return null;
                        dt.setUTCHours(0, 0, 0, 0);
                        return dt;
                    })
                    .filter(Boolean);

                const uniqueMap = new Map();
                parsed.forEach((d) => uniqueMap.set(d.toISOString(), d));
                update.blockedDates = Array.from(uniqueMap.values()).sort((a, b) => a - b);
            }

            if (Object.keys(update).length === 0) {
                return { success: true, message: 'Sin cambios', data: null };
            }

            const store = await Stores.findByIdAndUpdate(
                storeId,
                { $set: update },
                { new: true, runValidators: true }
            ).lean();

            if (!store) {
                return { success: false, message: 'Tienda no encontrada' };
            }

            return {
                success: true,
                message: 'Configuración actualizada correctamente',
                data: {
                    deliverOnHolidays: store.deliverOnHolidays !== false,
                    blockedDates: (store.blockedDates || []).map((d) => new Date(d).toISOString()),
                },
            };
        } catch (error) {
            console.error('❌ Servicio - Error al actualizar config de reparto:', error);
            return { success: false, message: error.message || 'Error al actualizar configuración' };
        }
    };
}
