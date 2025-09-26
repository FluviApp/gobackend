// src/services/store/StoreDiscountCodes.service.js
import connectMongoDB from '../../libs/mongoose.js';
import DiscountCodes from '../../models/DiscountCodes.js';

export default class StoreDiscountCodesService {
    constructor() {
        connectMongoDB();
    }

    getAllDiscountCodes = async ({ storeId, page = 1, limit = 10 }) => {
        try {
            const query = { storeId };
            const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                sort: { createdAt: -1 },
            };

            const result = await DiscountCodes.paginate(query, options);

            return {
                success: true,
                message: 'Códigos de descuento obtenidos correctamente',
                data: result,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener códigos:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener códigos de descuento',
            };
        }
    };

    createDiscountCode = async (data) => {
        try {
            console.log('🧠 Servicio - creando código con:', data);

            const existing = await DiscountCodes.findOne({ code: data.code.toUpperCase().trim() });
            if (existing) {
                const error = new Error('Ya existe un código con ese valor');
                error.statusCode = 400;
                throw error;
            }

            const newCode = new DiscountCodes({
                storeId: data.storeId,
                name: data.name.trim(),
                code: data.code.toUpperCase().trim(),
                status: typeof data.status === 'boolean' ? data.status : true,
            });

            const saved = await newCode.save();

            return {
                success: true,
                message: 'Código de descuento creado correctamente',
                data: saved,
            };
        } catch (error) {
            console.error('❌ Servicio - error al crear código:', error);
            return {
                success: false,
                message: error.message || 'Error inesperado al crear el código',
            };
        }
    };

    updateDiscountCode = async (id, data) => {
        try {
            const updated = await DiscountCodes.findByIdAndUpdate(id, {
                name: data.name.trim(),
                code: data.code.toUpperCase().trim(),
                status: typeof data.status === 'boolean' ? data.status : true,
            }, { new: true });

            if (!updated) {
                return {
                    success: false,
                    message: 'Código no encontrado',
                };
            }

            return {
                success: true,
                message: 'Código actualizado correctamente',
                data: updated,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al actualizar código:', error);
            return {
                success: false,
                message: 'Error inesperado al actualizar código',
            };
        }
    };

    deleteDiscountCode = async (id) => {
        try {
            const deleted = await DiscountCodes.findByIdAndDelete(id);

            if (!deleted) {
                return {
                    success: false,
                    message: 'Código no encontrado',
                };
            }

            return {
                success: true,
                message: 'Código eliminado correctamente',
            };
        } catch (error) {
            console.error('❌ Servicio - Error al eliminar código:', error);
            return {
                success: false,
                message: 'Error inesperado al eliminar código',
            };
        }
    };
}
