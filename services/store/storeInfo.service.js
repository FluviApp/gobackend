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

            const store = await Stores.findOne(
                { _id: storeId },
                { name: 1, image: 1, paymentmethod: 1, paymentFees: 1, taxPercent: 1, transferWhatsappMessage: 1 }
            ).lean();
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

    async updateStoreInfo({ storeId, paymentFees, taxPercent, transferWhatsappMessage }) {
        try {
            if (!storeId) {
                return { success: false, message: 'storeId es requerido' };
            }

            const update = {};
            if (paymentFees !== undefined) {
                update.paymentFees = paymentFees && typeof paymentFees === 'object' ? paymentFees : {};
            }
            if (taxPercent !== undefined) {
                const parsedTaxPercent = Number(taxPercent);
                update.taxPercent = Number.isFinite(parsedTaxPercent) && parsedTaxPercent >= 0 ? parsedTaxPercent : 0;
            }
            if (transferWhatsappMessage !== undefined) {
                update.transferWhatsappMessage = typeof transferWhatsappMessage === 'string' ? transferWhatsappMessage.trim() : '';
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
                data: store,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al actualizar info de la tienda:', error);
            return {
                success: false,
                message: error.message || 'Error al actualizar info de la tienda',
            };
        }
    }
}
