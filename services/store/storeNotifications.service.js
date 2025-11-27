import Notifications from '../../models/Notifications.js';
import Clients from '../../models/Clients.js';
import connectMongoDB from '../../libs/mongoose.js';
import fetch from 'node-fetch';

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

    // Función auxiliar para enviar push notification
    async sendPushNotificationToToken({ token, title, body, url }) {
        if (!token || !token.trim().startsWith('ExponentPushToken')) {
            console.warn('❌ Token inválido:', token);
            return { success: false, error: 'Token inválido' };
        }

        const message = {
            to: token.trim(),
            sound: 'default',
            title: title.trim(),
            body: body.trim(),
            data: url ? { url: url.trim() } : {},
        };

        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            const result = await response.json();
            
            if (result.data?.status === 'ok') {
                console.log('✅ Push notification enviada exitosamente a:', token.substring(0, 20) + '...');
                return { success: true, result };
            } else {
                console.warn('⚠️ Error en respuesta de Expo:', result);
                return { success: false, error: result.data?.error || 'Error desconocido' };
            }
        } catch (error) {
            console.error('❌ Error al enviar notificación push:', error);
            return { success: false, error: error.message };
        }
    }

    async createNotification(data) {
        try {
            const { title, body, url, storeId, recipientType, selectedToken } = data;
            let notifications = [];
            let sentCount = 0;
            let failedCount = 0;

            // Validar datos requeridos
            if (!title || !body || !storeId) {
                return {
                    success: false,
                    message: 'Título, cuerpo y storeId son obligatorios',
                };
            }

            // Caso 1: Envío a un cliente específico
            if (recipientType === 'SPECIFIC' && selectedToken) {
                // Validar token
                if (!selectedToken.trim().startsWith('ExponentPushToken')) {
                    return {
                        success: false,
                        message: 'Token de notificación inválido',
                    };
                }

                // Enviar push notification
                const pushResult = await this.sendPushNotificationToToken({
                    token: selectedToken,
                    title,
                    body,
                    url,
                });

                // Obtener email del cliente para guardar en BD
                const client = await Clients.findOne({ 
                    storeId, 
                    token: selectedToken.trim() 
                });

                if (!client || !client.email) {
                    return {
                        success: false,
                        message: 'No se encontró el cliente asociado a este token',
                    };
                }

                // Guardar notificación en BD
                const notification = await Notifications.create({
                    title: title.trim(),
                    body: body.trim(),
                    token: selectedToken.trim(),
                    url: url?.trim() || '',
                    storeId,
                    email: client.email,
                    seen: false,
                });

                notifications.push(notification);

                if (pushResult.success) {
                    sentCount = 1;
                } else {
                    failedCount = 1;
                }

                return {
                    success: true,
                    message: pushResult.success 
                        ? 'Notificación creada y enviada correctamente' 
                        : 'Notificación creada pero falló el envío',
                    data: notification,
                    sentCount,
                    failedCount,
                };
            }

            // Caso 2: Envío a todos los clientes (broadcast)
            if (recipientType === 'ALL') {
                // Obtener todos los clientes del store con token válido
                const clients = await Clients.find({
                    storeId,
                    token: { 
                        $exists: true, 
                        $ne: '', 
                        $regex: /^ExponentPushToken/ 
                    },
                });

                if (clients.length === 0) {
                    return {
                        success: false,
                        message: 'No hay clientes con tokens de notificación registrados',
                    };
                }

                console.log(`📢 Enviando notificación a ${clients.length} clientes...`);

                // Enviar a cada cliente (en paralelo con Promise.allSettled)
                const sendPromises = clients.map(async (client) => {
                    const pushResult = await this.sendPushNotificationToToken({
                        token: client.token,
                        title,
                        body,
                        url,
                    });

                    // Guardar notificación en BD para cada cliente (solo si tiene email)
                    if (client.email) {
                        const notification = await Notifications.create({
                            title: title.trim(),
                            body: body.trim(),
                            token: client.token,
                            url: url?.trim() || '',
                            storeId,
                            email: client.email,
                            seen: false,
                        });
                        return { notification, pushResult, client };
                    } else {
                        // Si no tiene email, solo intentar enviar push pero no guardar en BD
                        return { notification: null, pushResult, client };
                    }

                    return { notification, pushResult };
                });

                const results = await Promise.allSettled(sendPromises);

                // Contar éxitos y fallos
                results.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        // Solo agregar a notifications si se guardó en BD (tiene email)
                        if (result.value.notification) {
                            notifications.push(result.value.notification);
                        }
                        if (result.value.pushResult.success) {
                            sentCount++;
                        } else {
                            failedCount++;
                        }
                    } else {
                        failedCount++;
                        console.error('❌ Error procesando cliente:', result.reason);
                    }
                });

                console.log(`✅ Enviadas: ${sentCount}, Fallidas: ${failedCount}`);

                return {
                    success: true,
                    message: `Notificación creada. Enviadas: ${sentCount}, Fallidas: ${failedCount}`,
                    data: notifications,
                    sentCount,
                    failedCount,
                    total: clients.length,
                };
            }

            // Si no se especifica tipo de envío, solo guardar en BD (compatibilidad hacia atrás)
            const notification = await Notifications.create({
                title: title.trim(),
                body: body.trim(),
                token: data.token?.trim() || '',
                url: url?.trim() || '',
                storeId,
                seen: false,
            });

            return {
                success: true,
                message: 'Notificación creada correctamente (sin envío push)',
                data: notification,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al crear notificación:', error);
            return {
                success: false,
                message: 'Error al crear notificación',
                error: error.message,
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
