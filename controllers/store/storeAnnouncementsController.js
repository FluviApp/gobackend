import StoreAnnouncementsService from '../../services/store/storeAnnouncements.service.js';

const storeAnnouncementsService = new StoreAnnouncementsService();

export default class StoreAnnouncementsController {
    getAllAnnouncements = async (req, res) => {
        try {
            const { storeId } = req.query;
            const response = await storeAnnouncementsService.getAllAnnouncements({ storeId });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener avisos:', error);
            return res.status(500).json({ success: false, message: 'Error inesperado al obtener avisos' });
        }
    };

    createAnnouncement = async (req, res) => {
        try {
            const image = req.files?.image || null;
            const response = await storeAnnouncementsService.createAnnouncement({
                ...req.body,
                image,
            });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al crear aviso:', error);
            return res.status(500).json({ success: false, message: 'Error inesperado al crear aviso' });
        }
    };

    updateAnnouncement = async (req, res) => {
        try {
            const { id } = req.params;
            const image = req.files?.image || null;
            const response = await storeAnnouncementsService.updateAnnouncement(id, {
                ...req.body,
                image,
            });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al actualizar aviso:', error);
            return res.status(500).json({ success: false, message: 'Error inesperado al actualizar aviso' });
        }
    };

    deleteAnnouncement = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await storeAnnouncementsService.deleteAnnouncement(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al eliminar aviso:', error);
            return res.status(500).json({ success: false, message: 'Error inesperado al eliminar aviso' });
        }
    };
}
