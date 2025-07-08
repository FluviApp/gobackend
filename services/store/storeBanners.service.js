import fs from 'fs';
import path from 'path';
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
            const uploadDir = path.join(process.cwd(), 'public/uploads/banners');
            fs.mkdirSync(uploadDir, { recursive: true });

            const file = data.image;

            const extension = path.extname(file.name); // Ej: ".jpg"
            if (!extension) {
                throw new Error('El archivo no tiene extensión válida');
            }

            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const fileName = `${Date.now()}_${randomSuffix}${extension}`;
            const fullPath = path.join(uploadDir, fileName);

            await file.mv(fullPath);

            const banner = await Banners.create({
                name: data.name.trim(),
                image: `/uploads/banners/${fileName}`,
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
                const uploadDir = path.join(process.cwd(), 'public/uploads/banners');
                fs.mkdirSync(uploadDir, { recursive: true });

                const file = data.image;
                const extension = path.extname(file.name);
                if (!extension) {
                    throw new Error('El archivo no tiene extensión válida');
                }

                const randomSuffix = Math.random().toString(36).substring(2, 8);
                const fileName = `${Date.now()}_${randomSuffix}${extension}`;
                const fullPath = path.join(uploadDir, fileName);

                await file.mv(fullPath);
                updatedImage = `/uploads/banners/${fileName}`;

                // 🔥 Eliminar imagen antigua
                const oldPath = path.join(process.cwd(), 'public', banner.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

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

            const imagePath = path.join(process.cwd(), 'public', banner.image);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

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
}
