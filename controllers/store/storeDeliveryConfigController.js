import StoreDeliveryConfigService from '../../services/store/storeDeliveryConfig.service.js';

const storeDeliveryConfigService = new StoreDeliveryConfigService();

export default class StoreDeliveryConfigController {
    getDeliveryConfig = async (req, res) => {
        try {
            const { storeId } = req.query;
            const response = await storeDeliveryConfigService.getDeliveryConfig({ storeId });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener config de reparto:', error);
            return res.status(500).json({ success: false, message: 'Error inesperado' });
        }
    };

    updateDeliveryConfig = async (req, res) => {
        try {
            const { storeId, deliverOnHolidays, blockedDates } = req.body || {};
            const response = await storeDeliveryConfigService.updateDeliveryConfig({
                storeId,
                deliverOnHolidays,
                blockedDates,
            });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al actualizar config de reparto:', error);
            return res.status(500).json({ success: false, message: 'Error inesperado' });
        }
    };
}
