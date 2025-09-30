import StoreTransfersService from '../../services/store/storeTransfers.service.js';

const storeTransfersService = new StoreTransfersService();

export default class StoreTransfersController {
    getTransfersMonth = async (req, res) => {
        try {
            const { storeId, startDate, endDate, paymentMethod } = req.query;
            const response = await storeTransfersService.getTransfersMonth({
                storeId,
                startDate,
                endDate,
                paymentMethod, // opcional
            });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error en transfersmonth:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado en transfersmonth',
                error: String(error?.message || error),
            });
        }
    };

    // 👇 NUEVO: listar todas las órdenes del mes (por deliveredAt)
    listByDeliveredMonth = async (req, res) => {
        try {
            const { storeId, startDate, endDate } = req.query;
            const response = await storeTransfersService.listByDeliveredMonth({
                storeId,
                startDate,
                endDate,
            });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error en ordersbymonth-delivered:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado en ordersbymonth-delivered',
                error: String(error?.message || error),
            });
        }
    };
}
