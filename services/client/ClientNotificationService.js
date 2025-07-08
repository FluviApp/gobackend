import connectMongoDB from '../../libs/mongoose.js';
import Notifications from '../../models/Notifications.js';

export default class ClientNotificationService {
    constructor() {
        connectMongoDB();
    }

    getNotificationsByEmail = async (email) => {
        try {
            const notifications = await Notifications.find({ email }).sort({ createdAt: -1 });

            return {
                success: true,
                data: notifications,
            };
        } catch (error) {
            console.error('❌ ClientNotificationService - error en getNotificationsByEmail:', error);
            return {
                success: false,
                message: 'No se pudieron obtener las notificaciones',
            };
        }
    };
}
