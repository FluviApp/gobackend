import connectMongoDB from '../../libs/mongoose.js';
import Dealers from '../../models/Dealers.js';

export default class StoreDealersService {
    constructor() {
        connectMongoDB();
    }

    getAllDealers = async ({ storeId, page = 1, limit = 10 }) => {
        try {
            const query = { storeId };
            const options = { page: parseInt(page), limit: parseInt(limit), sort: { createdAt: -1 } };
            const result = await Dealers.paginate(query, options);
            return { success: true, message: 'Dealers obtenidos correctamente', data: result };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener dealers:', error);
            return { success: false, message: 'Error al obtener dealers' };
        }
    };

    getDealersByStoreId = async (storeId) => {
        try {
            const dealers = await Dealers.find({ storeId });
            return {
                success: true,
                data: dealers
            };
        } catch (error) {
            console.error('❌ Error al obtener repartidores por storeId:', error);
            return {
                success: false,
                message: 'No se pudieron obtener los repartidores'
            };
        }
    };

    createDealer = async (data) => {
        try {
            const exists = await Dealers.findOne({ mail: data.mail.toLowerCase() });
            if (exists) throw new Error('Ya existe un dealer con ese correo');

            const newDealer = new Dealers({
                name: data.name.trim(),
                mail: data.mail.toLowerCase().trim(),
                password: data.password.trim(),
                storeId: data.storeId,
                zoneId: '',
            });

            const saved = await newDealer.save();
            const result = saved.toObject();
            delete result.password;
            return { success: true, message: 'Dealer creado correctamente', data: result };
        } catch (error) {
            console.error('❌ Servicio - Error al crear dealer:', error);
            return { success: false, message: error.message || 'Error al crear dealer' };
        }
    };

    updateDealer = async (id, data) => {
        try {
            const updated = await Dealers.findByIdAndUpdate(id, data, { new: true });
            if (!updated) return { success: false, message: 'Dealer no encontrado' };
            return { success: true, message: 'Dealer actualizado correctamente', data: updated };
        } catch (error) {
            console.error('❌ Servicio - Error al actualizar dealer:', error);
            return { success: false, message: 'Error al actualizar dealer' };
        }
    };

    deleteDealer = async (id) => {
        try {
            const deleted = await Dealers.findByIdAndDelete(id);
            if (!deleted) return { success: false, message: 'Dealer no encontrado' };
            return { success: true, message: 'Dealer eliminado correctamente' };
        } catch (error) {
            console.error('❌ Servicio - Error al eliminar dealer:', error);
            return { success: false, message: 'Error al eliminar dealer' };
        }
    };
}


