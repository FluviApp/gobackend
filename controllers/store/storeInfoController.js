import StoreInfoService from '../../services/store/storeInfo.service.js';

const storeInfoService = new StoreInfoService();

export default class StoreInfoController {
    getStoreInfo = async (req, res) => {
        try {
            const { storeId } = req.query;
            const response = await storeInfoService.getStoreInfo({ storeId });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener info de la tienda:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener info de la tienda',
            });
        }
    };

    updateStoreInfo = async (req, res) => {
        try {
            const { storeId } = req.query;
            const { paymentFees, taxPercent, transferWhatsappMessage } = req.body || {};
            const response = await storeInfoService.updateStoreInfo({ storeId, paymentFees, taxPercent, transferWhatsappMessage });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al actualizar info de la tienda:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al actualizar info de la tienda',
            });
        }
    };
}
