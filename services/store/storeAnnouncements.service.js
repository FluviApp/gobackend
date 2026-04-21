import cloudinary from '../../utils/cloudinary.js';
import Announcements from '../../models/Announcements.js';
import connectMongoDB from '../../libs/mongoose.js';

export default class StoreAnnouncementsService {
    constructor() {
        connectMongoDB();
    }

    getAllAnnouncements = async ({ storeId }) => {
        try {
            const announcements = await Announcements.find({ storeId }).sort({ createdAt: -1 });

            return {
                success: true,
                message: 'Avisos obtenidos correctamente',
                data: announcements,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener avisos:', error);
            return {
                success: false,
                message: 'Error al obtener avisos',
            };
        }
    };

    createAnnouncement = async (data) => {
        try {
            let imageUrl = '';
            let imagePublicId = '';

            if (data.image) {
                const result = await cloudinary.uploader.upload(
                    data.image.tempFilePath || data.image.path,
                    { folder: 'announcements' }
                );
                imageUrl = result.secure_url;
                imagePublicId = result.public_id;
            }

            const endDate = data.endDate ? new Date(data.endDate) : null;
            if (!endDate || isNaN(endDate.getTime())) {
                return { success: false, message: 'Fecha fin inválida' };
            }

            const announcement = await Announcements.create({
                storeId: data.storeId,
                title: (data.title || '').trim(),
                message: (data.message || '').trim(),
                imageUrl,
                imagePublicId,
                endDate,
                active: data.active !== undefined ? data.active === true || data.active === 'true' : true,
            });

            return {
                success: true,
                message: 'Aviso creado correctamente',
                data: announcement,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al crear aviso:', error);
            return {
                success: false,
                message: 'Error al crear aviso',
            };
        }
    };

    updateAnnouncement = async (id, data) => {
        try {
            const announcement = await Announcements.findById(id);
            if (!announcement) return { success: false, message: 'Aviso no encontrado' };

            let imageUrl = announcement.imageUrl;
            let imagePublicId = announcement.imagePublicId;

            if (data.image) {
                const uploadResult = await cloudinary.uploader.upload(
                    data.image.tempFilePath || data.image.path,
                    { folder: 'announcements' }
                );
                imageUrl = uploadResult.secure_url;

                if (announcement.imagePublicId) {
                    try {
                        await cloudinary.uploader.destroy(announcement.imagePublicId);
                    } catch (err) {
                        console.warn('⚠️ No se pudo eliminar imagen anterior de Cloudinary:', err?.message);
                    }
                }
                imagePublicId = uploadResult.public_id;
            }

            const update = {
                title: data.title !== undefined ? (data.title || '').trim() : announcement.title,
                message: data.message !== undefined ? (data.message || '').trim() : announcement.message,
                imageUrl,
                imagePublicId,
            };

            if (data.endDate !== undefined) {
                const endDate = new Date(data.endDate);
                if (isNaN(endDate.getTime())) {
                    return { success: false, message: 'Fecha fin inválida' };
                }
                update.endDate = endDate;
            }

            if (data.active !== undefined) {
                update.active = data.active === true || data.active === 'true';
            }

            const updated = await Announcements.findByIdAndUpdate(id, update, { new: true });

            return {
                success: true,
                message: 'Aviso actualizado correctamente',
                data: updated,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al actualizar aviso:', error);
            return {
                success: false,
                message: 'Error al actualizar aviso',
            };
        }
    };

    deleteAnnouncement = async (id) => {
        try {
            const announcement = await Announcements.findByIdAndDelete(id);
            if (!announcement) return { success: false, message: 'Aviso no encontrado' };

            if (announcement.imagePublicId) {
                try {
                    await cloudinary.uploader.destroy(announcement.imagePublicId);
                } catch (err) {
                    console.warn('⚠️ No se pudo eliminar imagen de Cloudinary:', err?.message);
                }
            }

            return {
                success: true,
                message: 'Aviso eliminado correctamente',
            };
        } catch (error) {
            console.error('❌ Servicio - Error al eliminar aviso:', error);
            return {
                success: false,
                message: 'Error al eliminar aviso',
            };
        }
    };
}
