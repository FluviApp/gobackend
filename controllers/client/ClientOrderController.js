import ClientOrderService from '../../services/client/ClientOrderService.js';

const clientOrderService = new ClientOrderService();

export default class ClientOrderController {
    createOrder = async (req, res) => {
        try {
            const response = await clientOrderService.createOrder(req.body);
            const status = response.success ? 201 : 400;
            return res.status(status).json(response);
        } catch (error) {
            console.error('❌ ClientOrderController - error en createOrder:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al crear el pedido',
            });
        }
    };

    getPendingOrders = async (req, res) => {
        try {
            const { email } = req.query;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo electrónico es requerido',
                });
            }

            const response = await clientOrderService.getPendingOrdersByEmail(email);
            return res.status(200).json(response);
        } catch (error) {
            console.error('❌ ClientOrderController - error en getPendingOrders:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener los pedidos pendientes',
            });
        }
    };

    getOrdersByClientId = async (req, res) => {
        try {
            const { clientId } = req.params;

            if (!clientId) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del cliente es requerido',
                });
            }

            const response = await clientOrderService.getOrdersByClientId(clientId);
            return res.status(200).json(response);
        } catch (error) {
            console.error('❌ ClientOrderController - error en getOrdersByClientId:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener los pedidos del cliente',
            });
        }
    };


}
