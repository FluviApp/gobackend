// controllers/store/storeOrdersByDeliveredMonthController.js
import StoreOrdersByDeliveredMonthService from '../../services/store/StoreOrdersByDeliveredMonth.service.js';
const service = new StoreOrdersByDeliveredMonthService();

export default class StoreOrdersByDeliveredMonthController {
    list = async (req, res) => {
        try {
            const { storeId, startDate, endDate } = req.query;
            const resp = await service.listByDeliveredMonth({ storeId, startDate, endDate });
            return res.status(resp.success ? 200 : 400).json(resp);
        } catch (e) {
            console.error('❌ Controller listByDeliveredMonth:', e);
            return res.status(500).json({ success: false, message: 'Error inesperado', error: String(e?.message || e) });
        }
    };
}
