import Notifications from '../../models/Notifications.js';
import connectMongoDB from '../../libs/mongoose.js';

export default class StoreNotificationsService {
    constructor() {
        connectMongoDB();
    }

    async getAllNotifications({ storeId }) {
        try {
            const notifications = await Notifications.find({ storeId }).sort({ createdAt: -1 });

            return {
                success: true,
                message: 'Notificaciones obtenidas correctamente',
                data: notifications,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener notificaciones:', error);
            return {
                success: false,
                message: 'Error al obtener notificaciones',
            };
        }
    }

    async createNotification(data) {
        try {
            const notification = await Notifications.create({
                title: data.title.trim(),
                body: data.body.trim(),
                token: data.token?.trim() || '',
                url: data.url?.trim() || '',
                storeId: data.storeId,
                seen: false,
            });

            return {
                success: true,
                message: 'Notificación creada correctamente',
                data: notification,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al crear notificación:', error);
            return {
                success: false,
                message: 'Error al crear notificación',
            };
        }
    }

    async updateNotification(id, data) {
        try {
            const notification = await Notifications.findById(id);
            if (!notification) return { success: false, message: 'Notificación no encontrada' };

            const updated = await Notifications.findByIdAndUpdate(
                id,
                {
                    title: data.title?.trim(),
                    body: data.body?.trim(),
                    token: data.token?.trim() || '',
                    url: data.url?.trim() || '',
                },
                { new: true }
            );

            return {
                success: true,
                message: 'Notificación actualizada correctamente',
                data: updated,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al actualizar notificación:', error);
            return {
                success: false,
                message: 'Error al actualizar notificación',
            };
        }
    }

    async deleteNotification(id) {
        try {
            const deleted = await Notifications.findByIdAndDelete(id);
            if (!deleted) return { success: false, message: 'Notificación no encontrada' };

            return {
                success: true,
                message: 'Notificación eliminada correctamente',
            };
        } catch (error) {
            console.error('❌ Servicio - Error al eliminar notificación:', error);
            return {
                success: false,
                message: 'Error al eliminar notificación',
            };
        }
    }
}
