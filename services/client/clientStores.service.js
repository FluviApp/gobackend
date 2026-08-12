import connectMongoDB from '../../libs/mongoose.js';
import Stores from '../../models/Stores.js';

export default class ClientStoresService {
    constructor() {
        connectMongoDB();
    }

    // Resuelve un código de tienda (ej: "AGUAQUERICA-7K2Q") a su tienda.
    // Usado por la compuerta de la app: el cliente entra directo a esa marca.
    getStoreByCode = async (code) => {
        try {
            const clean = String(code || '').trim().toUpperCase();
            if (!clean) {
                return { success: false, message: 'Código requerido' };
            }

            const store = await Stores.findOne(
                { code: clean },
                { name: 1, image: 1, code: 1 }
            ).lean();

            if (!store) {
                return { success: false, message: 'No encontramos una tienda con ese código.' };
            }

            return {
                success: true,
                message: 'Tienda encontrada',
                data: {
                    storeId: store._id.toString(),
                    name: store.name,
                    logo: store.image,
                    code: store.code,
                },
            };
        } catch (error) {
            console.error('❌ Servicio - Error en getStoreByCode:', error);
            return { success: false, message: 'Error al buscar la tienda' };
        }
    };
}
