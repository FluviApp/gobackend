import StoreOrdersService from '../../services/store/storeOrders.service.js';

const service = new StoreOrdersService();

export default class StoreOrdersController {
    getAllOrders = async (req, res) => {
        try {
            const { storeId, page = 1, limit = 50, startDate, endDate } = req.query;

            console.log('🧪 Params recibidos:', req.query); // Confirma que vienen bien

            const response = await service.getAllOrders({
                storeId,
                page,
                limit,
                startDate,
                endDate, // ✅ AGREGAR ESTO
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener pedidos'
            });
        }
    };


    createOrder = async (req, res) => {
        try {
            const response = await service.createOrder(req.body);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al crear pedido'
            });
        }
    };

    updateOrder = async (req, res) => {
        try {
            const response = await service.updateOrder(req.params.id, req.body);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar pedido'
            });
        }
    };

    deleteOrder = async (req, res) => {
        try {
            const response = await service.deleteOrder(req.params.id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar pedido'
            });
        }
    };
}