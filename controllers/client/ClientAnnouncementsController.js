import ClientAnnouncementsService from '../../services/client/clientAnnouncements.service.js';

const clientAnnouncementsService = new ClientAnnouncementsService();

export default class ClientAnnouncementsController {
    getActiveAnnouncements = async (req, res) => {
        try {
            const { storeId } = req.query;
            const response = await clientAnnouncementsService.getActiveAnnouncements({ storeId });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener avisos activos:', error);
            return res.status(500).json({ success: false, message: 'Error inesperado al obtener avisos activos' });
        }
    };
}
