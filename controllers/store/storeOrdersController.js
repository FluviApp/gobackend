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
                transferPay,
                paymentMethod,
                deliveryType
            } = req.query;

            console.log('🧪 Params recibidos:', req.query); // Verifica todos los params

            const response = await service.getAllOrders({
                storeId,
                page,
                limit,
                startDate,
                endDate,
                status,
                transferPay,
                paymentMethod,
                deliveryType
            });

            // Log detallado de la respuesta
            if (response.success && response.data) {
                const totalDocs = response.data.docs?.length || 0;
                const localOrders = response.data.docs?.filter(d => d.deliveryType === 'local').length || 0;
                console.log('📊 Respuesta getAllOrders:', {
                    totalDocs,
                    localOrders,
                    deliveryTypes: [...new Set(response.data.docs?.map(d => d.deliveryType) || [])]
                });
            }

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
            const { storeId, datePreset } = req.query;

            const response = await service.getPendingOrders({
                storeId,
                datePreset: datePreset || 'today',
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Error al obtener pedidos pendientes:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener pedidos pendientes',
            });
        }
    };


}