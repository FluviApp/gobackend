import connectMongoDB from '../../libs/mongoose.js';
import Subcategory from '../../models/Subcategory.js';
import cloudinary from '../../utils/cloudinary.js';
import fs from 'fs';
import path from 'path';

export default class StoreSubcategoriesService {
    constructor() {
        connectMongoDB();
    }

    getSubcategories = async ({ storeId, categoryId, page = 1, limit = 10 }) => {
        try {
            const query = {
                storeId,
                categoryId
            };

            const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                sort: { createdAt: -1 }
            };

            const result = await Subcategory.paginate(query, options);

            return {
                success: true,
                message: 'Subcategorías obtenidas correctamente',
                data: result
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener subcategorías:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener subcategorías'
            };
        }
    };

    createSubcategory = async (data) => {
        try {
            let imageUrl = '';

            if (data.image) {
                const uploadResult = await cloudinary.uploader.upload(
                    data.image.tempFilePath || data.image.path,
                    { folder: 'subcategories' }
                );
                imageUrl = uploadResult.secure_url;
            }

            const newSubcategory = new Subcategory({
                name: data.name.trim(),
                image: imageUrl,
                storeId: data.storeId,
                categoryId: data.categoryId
            });

            const saved = await newSubcategory.save();

            return {
                success: true,
                message: 'Subcategoría creada correctamente',
                data: saved
            };
        } catch (error) {
            console.error('❌ Servicio - Error al crear subcategoría:', error);
            return {
                success: false,
                message: 'Error inesperado al crear subcategoría'
            };
        }
    };


    updateSubcategory = async (id, data) => {
        try {
            const existing = await Subcategory.findById(id);
            if (!existing) {
                return {
                    success: false,
                    message: 'Subcategoría no encontrada',
                };
            }

            let updatedImage = existing.image;

            if (data.image) {
                // 📤 Subir nueva imagen a Cloudinary
                const uploadResult = await cloudinary.uploader.upload(
                    data.image.tempFilePath || data.image.path,
                    { folder: 'subcategories' }
                );
                updatedImage = uploadResult.secure_url;

                // 🧹 Eliminar imagen anterior de Cloudinary
                if (existing.image?.includes('cloudinary')) {
                    const publicId = this.getPublicIdFromUrl(existing.image);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                        console.log('🗑 Imagen anterior de Cloudinary eliminada:', publicId);
                    }
                }
            }

            const updated = await Subcategory.findByIdAndUpdate(
                id,
                {
                    name: data.name,
                    storeId: data.storeId,
                    categoryId: data.categoryId,
                    image: updatedImage,
                },
                { new: true }
            );

            return {
                success: true,
                message: 'Subcategoría actualizada correctamente',
                data: updated,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al actualizar subcategoría:', error);
            return {
                success: false,
                message: 'Error inesperado al actualizar subcategoría',
            };
        }
    };



    deleteSubcategory = async (id) => {
        try {
            const subcategory = await Subcategory.findByIdAndDelete(id);

            if (!subcategory) {
                return {
                    success: false,
                    message: 'Subcategoría no encontrada'
                };
            }

            // 🧹 Eliminar imagen de Cloudinary si existe
            if (subcategory.image?.includes('cloudinary')) {
                const publicId = this.getPublicIdFromUrl(subcategory.image);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                    console.log('🗑 Imagen eliminada de Cloudinary:', publicId);
                }
            }

            // 🧹 En caso de imagen local (ruta /uploads), también se borra
            if (subcategory.image?.startsWith('/uploads')) {
                const imagePath = path.join(process.cwd(), 'public', subcategory.image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log('🗑 Imagen local eliminada:', imagePath);
                }
            }

            return {
                success: true,
                message: 'Subcategoría eliminada correctamente'
            };
        } catch (error) {
            console.error('❌ Servicio - Error al eliminar subcategoría:', error);
            return {
                success: false,
                message: 'Error inesperado al eliminar subcategoría'
            };
        }
    };


    getPublicIdFromUrl = (url) => {
        try {
            const urlObj = new URL(url);
            const parts = urlObj.pathname.split('/');
            const fileWithExt = parts.pop();
            const [publicId] = fileWithExt.split('.');
            const folder = parts.pop();
            return `${folder}/${publicId}`;
        } catch (err) {
            console.warn('⚠️ Error al extraer public_id de URL:', err.message);
            return null;
        }
    };

}
