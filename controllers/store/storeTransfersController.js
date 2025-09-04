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
                paymentMethod, // opcional; por defecto 'transferencia'
            });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error en transfersmonth:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado en transfersmonth',
            });
        }
    };
}
