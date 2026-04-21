import Announcements from '../../models/Announcements.js';
import connectMongoDB from '../../libs/mongoose.js';

export default class ClientAnnouncementsService {
    constructor() {
        connectMongoDB();
    }

    getActiveAnnouncements = async ({ storeId }) => {
        try {
            if (!storeId) {
                return { success: false, message: 'storeId es requerido' };
            }

            const now = new Date();
            const announcements = await Announcements.find({
                storeId,
                active: true,
                endDate: { $gte: now },
            })
                .sort({ createdAt: -1 })
                .select('title message imageUrl endDate createdAt');

            return {
                success: true,
                message: 'Avisos activos obtenidos correctamente',
                data: announcements,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener avisos activos:', error);
            return {
                success: false,
                message: 'Error al obtener avisos activos',
            };
        }
    };
}
