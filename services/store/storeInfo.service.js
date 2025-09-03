import connectMongoDB from '../../libs/mongoose.js';
import Stores from '../../models/Stores.js';

export default class StoreInfoService {
    constructor() {
        connectMongoDB();
    }

    async getStoreInfo({ storeId }) {
        try {
            if (!storeId) {
                return { success: false, message: 'storeId es requerido' };
            }

            const store = await Stores.findOne({ _id: storeId }, { name: 1, image: 1 }).lean();
            if (!store) {
                return { success: false, message: 'Tienda no encontrada' };
            }

            return {
                success: true,
                message: 'Info de tienda obtenida correctamente',
                data: store,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener info de la tienda:', error);
            return {
                success: false,
                message: 'Error al obtener info de la tienda',
            };
        }
    }
}
