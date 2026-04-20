// src/controllers/client/ClientDiscountCodesController.js
import ClientDiscountCodesService from '../../services/client/ClientDiscountCodesService.js';

const clientDiscountCodesService = new ClientDiscountCodesService();

export default class ClientDiscountCodesController {
    validateDiscountCode = async (req, res) => {
        try {
            const { code, storeId, subtotal, email, userId } = req.body || {};
            const response = await clientDiscountCodesService.validateDiscountCode({
                code,
                storeId,
                subtotal,
                email,
                userId,
            });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ ClientDiscountCodesController - validateDiscountCode:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al validar el código',
            });
        }
    };
}
