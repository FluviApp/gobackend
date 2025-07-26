import StoreOrdersService from '../../services/store/storeOrders.service.js';

const service = new StoreOrdersService();

export default class StoreOrdersController {
    getAllOrders = async (req, res) => {
        try {
            const {
                storeId,
                page = 1,
                limit = 50,
                startDate,
                endDate,
                status,
                transferPay
            } = req.query;

            console.log('🧪 Params recibidos:', req.query); // Verifica todos los params

            const response = await service.getAllOrders({
                storeId,
                page,
                limit,
                startDate,
                endDate,
                status,
                transferPay
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Error en getAllOrders controller:', error);
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

    getPendingOrders = async (req, res) => {
        try {
            const { storeId } = req.query; // Obtener storeId del query

            // Verificar que se estén pasando los parámetros correctamente
            console.log('🏷️ Store ID:', storeId);

            const response = await service.getPendingOrders({
                storeId,
            });

            // Verifica si la respuesta contiene los datos correctos
            console.log('🎯 Respuesta del servicio:', response);

            return res.status(response.success ? 200 : 400).json(response); // Devuelve la respuesta correctamente
        } catch (error) {
            console.error('❌ Error al obtener pedidos hasta hoy:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener pedidos hasta hoy',
            });
        }
    };


}