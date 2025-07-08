import ClientNotificationService from '../../services/client/ClientNotificationService.js';

const clientNotificationService = new ClientNotificationService();

export default class ClientNotificationController {
    getNotificationsByEmail = async (req, res) => {
        try {
            const { email } = req.query;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo electrónico es requerido',
                });
            }

            const response = await clientNotificationService.getNotificationsByEmail(email);
            return res.status(200).json(response);
        } catch (error) {
            console.error('❌ ClientNotificationController - error en getNotificationsByEmail:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener las notificaciones',
            });
        }
    };
}
