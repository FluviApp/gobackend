import fs from 'fs';
import path from 'path';
import cloudinary from '../../utils/cloudinary.js';
import Banners from '../../models/Banners.js';
import connectMongoDB from '../../libs/mongoose.js';

export default class StoreBannersService {
    constructor() {
        connectMongoDB();
    }

    async getAllBanners({ storeId }) {
        try {
            const banners = await Banners.find({ storeId }).sort({ createdAt: -1 });

            return {
                success: true,
                message: 'Banners obtenidos correctamente',
                data: banners,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener banners:', error);
            return {
                success: false,
                message: 'Error al obtener banners',
            };
        }
    }


    async createBanner(data) {
        try {
            let imageUrl = '';

            if (data.image) {
                const result = await cloudinary.uploader.upload(
                    data.image.tempFilePath || data.image.path,
                    { folder: 'banners' }
                );
                imageUrl = result.secure_url;
                console.log('📤 Imagen subida a Cloudinary:', imageUrl);
            }

            const banner = await Banners.create({
                name: data.name.trim(),
                image: imageUrl,
                link: data.link?.trim() || '',
                storeId: data.storeId,
            });

            return {
                success: true,
                message: 'Banner creado correctamente',
                data: banner,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al crear banner:', error);
            return {
                success: false,
                message: 'Error al crear banner',
            };
        }
    }



    async updateBanner(id, data) {
        try {
            const banner = await Banners.findById(id);
            if (!banner) return { success: false, message: 'Banner no encontrado' };

            let updatedImage = banner.image;

            if (data.image) {
                // 1. Subir nueva imagen
                const uploadResult = await cloudinary.uploader.upload(
                    data.image.tempFilePath || data.image.path,
                    { folder: 'banners' }
                );
                updatedImage = uploadResult.secure_url;

                // 2. Eliminar anterior
                if (banner.image && banner.image.includes('res.cloudinary.com')) {
                    const publicId = this.getPublicIdFromUrl(banner.image);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                        console.log('🗑 Imagen antigua eliminada de Cloudinary:', publicId);
                    }
                }
            }

            // 3. Actualizar campos
            const updated = await Banners.findByIdAndUpdate(
                id,
                {
                    name: data.name?.trim(),
                    image: updatedImage,
                    link: data.link?.trim() || '',
                },
                { new: true }
            );

            return {
                success: true,
                message: 'Banner actualizado correctamente',
                data: updated,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al actualizar banner:', error);
            return {
                success: false,
                message: 'Error al actualizar banner',
            };
        }
    }


    async deleteBanner(id) {
        try {
            const banner = await Banners.findByIdAndDelete(id);
            if (!banner) return { success: false, message: 'Banner no encontrado' };

            // 🔥 Eliminar imagen de Cloudinary
            if (banner.image && banner.image.includes('res.cloudinary.com')) {
                const publicId = this.getPublicIdFromUrl(banner.image);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                    console.log('🗑 Imagen eliminada de Cloudinary:', publicId);
                }
            }

            return {
                success: true,
                message: 'Banner eliminado correctamente',
            };
        } catch (error) {
            console.error('❌ Servicio - Error al eliminar banner:', error);
            return {
                success: false,
                message: 'Error al eliminar banner',
            };
        }
    }

    getPublicIdFromUrl = (url) => {
        try {
            const parts = url.split('/');
            const fileWithExtension = parts[parts.length - 1];
            const [publicId] = fileWithExtension.split('.');
            const folder = parts[parts.length - 2];
            return `${folder}/${publicId}`;
        } catch {
            return null;
        }
    };
}
