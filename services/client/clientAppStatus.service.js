import connectMongoDB from '../../libs/mongoose.js';
import Commerce from '../../models/Commerce.js';
import Zones from '../../models/Zones.js';
import Stores from '../../models/Stores.js';

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

    getStoreData = async (storeId) => {
        try {
            const store = await Stores.findOne({ _id: storeId }).lean();
            if (!store) {
                return { success: false, message: 'Tienda no encontrada' };
            }

            const zones = await Zones.find({ storeId }).lean();
            if (!zones || zones.length === 0) {
                return { success: false, message: 'Zonas de entrega no encontradas' };
            }

            const formattedZones = zones.map(zone => ({
                deliveryCost: zone.deliveryCost,
                schedule: zone.schedule
            }));

            return {
                success: true,
                message: 'Datos de tienda obtenidos correctamente',
                data: {
                    paymentMethods: store.paymentmethod,
                    deliveryZones: formattedZones
                }
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener datos de tienda:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener datos de tienda',
            };
        }
    };

}
