// controllers/store/storeOrdersByMonthController.js
import StoreOrdersByMonthService from '../../services/store/StoreOrdersByMonth.service.js';
const service = new StoreOrdersByMonthService();

export default class StoreOrdersByMonthController {
    list = async (req, res) => {
        try {
            const { storeId, startDate, endDate, dateField } = req.query;
            const resp = await service.listByStoreMonth({ storeId, startDate, endDate, dateField });
            return res.status(resp.success ? 200 : 400).json(resp);
        } catch (e) {
            console.error('❌ Controller listByStoreMonth:', e);
            return res.status(500).json({ success: false, message: 'Error inesperado' });
        }
    };
}
