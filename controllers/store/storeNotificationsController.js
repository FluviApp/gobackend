import StoreNotificationsService from '../../services/store/storeNotifications.service.js';

const storeNotificationsService = new StoreNotificationsService();

export default class StoreNotificationsController {
    getAllNotifications = async (req, res) => {
        try {
            const { storeId } = req.query;

            const response = await storeNotificationsService.getAllNotifications({ storeId });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener notificaciones:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener notificaciones',
            });
        }
    };

    createNotification = async (req, res) => {
        try {
            const response = await storeNotificationsService.createNotification({
                ...req.body,
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al crear notificación:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al crear notificación',
            });
        }
    };

    updateNotification = async (req, res) => {
        try {
            const { id } = req.params;

            const response = await storeNotificationsService.updateNotification(id, {
                ...req.body,
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al actualizar notificación:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al actualizar notificación',
            });
        }
    };

    deleteNotification = async (req, res) => {
        try {
            const { id } = req.params;

            const response = await storeNotificationsService.deleteNotification(id);

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al eliminar notificación:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al eliminar notificación',
            });
        }
    };
}
