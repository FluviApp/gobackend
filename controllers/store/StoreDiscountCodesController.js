// src/controllers/store/StoreDiscountCodesController.js
import StoreDiscountCodesService from '../../services/store/storeDiscountCodes.service.js';

const storeDiscountCodesService = new StoreDiscountCodesService();

export default class StoreDiscountCodesController {
    getAllDiscountCodes = async (req, res) => {
        try {
            const { storeId, page = 1, limit = 10 } = req.query;

            const response = await storeDiscountCodesService.getAllDiscountCodes({ storeId, page, limit });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener códigos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener códigos',
            });
        }
    };

    createDiscountCode = async (req, res) => {
        try {
            const response = await storeDiscountCodesService.createDiscountCode(req.body);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al crear código:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado al crear código',
            });
        }
    };

    updateDiscountCode = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await storeDiscountCodesService.updateDiscountCode(id, req.body);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al actualizar código:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al actualizar código',
            });
        }
    };

    deleteDiscountCode = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await storeDiscountCodesService.deleteDiscountCode(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al eliminar código:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al eliminar código',
            });
        }
    };
}
