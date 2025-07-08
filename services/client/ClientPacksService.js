import connectMongoDB from '../../libs/mongoose.js';
import Packs from '../../models/Packs.js';

export default class ClientPacksService {
    constructor() {
        connectMongoDB(); // Asegura la conexión
    }

    getPacksByStoreId = async (storeId) => {
        try {
            const packs = await Packs.find({ storeId }).sort({ createdAt: -1 });

            return {
                success: true,
                message: 'Packs obtenidos correctamente',
                data: packs,
            };
        } catch (error) {
            console.error('❌ ClientPacksService - Error al obtener packs:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener packs',
            };
        }
    };
}
