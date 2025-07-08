import DeliveryAuthService from '../../services/delivery/DeliveryAuthService.js';

const DeliveryAuth = new DeliveryAuthService();

export default class DeliveryAuthController {
    login = async (req, res) => {
        console.log('controller')
        try {
            const response = await DeliveryAuth.login(req.body);
            const status = response.success ? 200 : 401;
            return res.status(status).json(response);
        } catch (error) {
            console.error('❌ DeliveryAuthController - error en login:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor',
            });
        }
    };

    register = async (req, res) => {
        try {
            const response = await DeliveryAuth.register(req.body);
            const status = response.success ? 201 : 400;
            return res.status(status).json(response);
        } catch (error) {
            console.error('❌ DeliveryAuthController - error en register:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor',
            });
        }
    };

    recoverPassword = async (req, res) => {
        try {
            const response = await DeliveryAuth.recoverPassword(req.body);
            const status = response.success ? 200 : 404;
            return res.status(status).json(response);
        } catch (error) {
            console.error('❌ DeliveryAuthController - error en recoverPassword:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor',
            });
        }
    };

    getDeliveryById = async (req, res) => {
        try {
            const { id } = req.params;
            const delivery = await DeliveryAuth.getDeliveryById(id);

            if (!delivery) {
                return res.status(404).json({ success: false, message: 'Repartidor no encontrado' });
            }

            return res.status(200).json({ success: true, data: delivery });
        } catch (error) {
            console.error('❌ Error en getDeliveryById:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener repartidor' });
        }
    };

    updateDelivery = async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const updated = await DeliveryAuth.updateDelivery(id, updateData);

            if (!updated) {
                return res.status(404).json({ success: false, message: 'Repartidor no encontrado o no se pudo actualizar' });
            }

            return res.status(200).json({ success: true, data: updated });
        } catch (error) {
            console.error('❌ DeliveryAuthController - error en updateDelivery:', error);
            return res.status(500).json({ success: false, message: 'Error al actualizar repartidor' });
        }
    };
}
