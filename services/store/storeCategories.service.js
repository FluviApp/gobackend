import connectMongoDB from '../../libs/mongoose.js';
import Category from '../../models/Category.js';
import cloudinary from '../../utils/cloudinary.js';
import fs from 'fs';
import path from 'path';

export default class StoreCategoriesService {
    constructor() {
        connectMongoDB();
    }

    getAllCategories = async ({ storeId, page = 1, limit = 10 }) => {
        try {
            const query = { storeId };
            const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                sort: { createdAt: -1 },
            };

            const result = await Category.paginate(query, options);

            return {
                success: true,
                message: 'Categorías paginadas correctamente',
                data: result,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener categorías:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener categorías',
            };
        }
    };

    createCategory = async (data) => {
        console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
        console.log('crear cat 1')
        try {
            let imagePath = '';
            let imageWidePath = '';

            // ✅ Subida a Cloudinary (cuadrada — app vieja)
            if (data.image) {
                const result = await cloudinary.uploader.upload(data.image.tempFilePath || data.image.path, {
                    folder: 'categories', // nombre de carpeta en Cloudinary
                });
                imagePath = result.secure_url; // URL segura para usar en el frontend
                console.log('📷 Imagen subida a Cloudinary:', imagePath);
            }

            // ✅ Subida a Cloudinary (rectangular 2:1 — app nueva)
            if (data.imageWide) {
                const resultWide = await cloudinary.uploader.upload(data.imageWide.tempFilePath || data.imageWide.path, {
                    folder: 'categories',
                });
                imageWidePath = resultWide.secure_url;
                console.log('📷 Imagen rectangular subida a Cloudinary:', imageWidePath);
            }

            const newCategory = new Category({
                name: data.name.trim(),
                image: imagePath,
                imageWide: imageWidePath,
                storeId: data.storeId,
            });

            const savedCategory = await newCategory.save();

            return {
                success: true,
                message: 'Categoría creada correctamente',
                data: savedCategory,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al crear categoría:', error);
            return {
                success: false,
                message: 'Error inesperado al crear categoría',
            };
        }
    };


    updateCategory = async (id, categoryData) => {
        try {
            const existing = await Category.findById(id);
            if (!existing) {
                return {
                    success: false,
                    message: 'Categoría no encontrada',
                };
            }

            let imagePath = existing.image; // conservar la actual por defecto
            let imageWidePath = existing.imageWide; // conservar la rectangular por defecto

            // ✅ Si se envía una nueva imagen cuadrada
            if (categoryData.image) {
                // 1. Subir nueva a Cloudinary
                const uploadResult = await cloudinary.uploader.upload(
                    categoryData.image.tempFilePath || categoryData.image.path,
                    { folder: 'categories' }
                );
                imagePath = uploadResult.secure_url;

                // 2. Borrar imagen anterior de Cloudinary si era de allí
                if (existing.image && existing.image.includes('res.cloudinary.com')) {
                    const publicId = this.getPublicIdFromUrl(existing.image);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                        console.log('🗑 Imagen anterior eliminada de Cloudinary:', publicId);
                    }
                }
            }

            // ✅ Si se envía una nueva imagen rectangular (2:1)
            if (categoryData.imageWide) {
                const uploadWide = await cloudinary.uploader.upload(
                    categoryData.imageWide.tempFilePath || categoryData.imageWide.path,
                    { folder: 'categories' }
                );
                imageWidePath = uploadWide.secure_url;

                if (existing.imageWide && existing.imageWide.includes('res.cloudinary.com')) {
                    const publicId = this.getPublicIdFromUrl(existing.imageWide);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                        console.log('🗑 Imagen rectangular anterior eliminada de Cloudinary:', publicId);
                    }
                }
            }

            // 3. Actualizar en MongoDB
            const updated = await Category.findByIdAndUpdate(
                id,
                {
                    name: categoryData.name,
                    storeId: categoryData.storeId,
                    image: imagePath,
                    imageWide: imageWidePath,
                },
                { new: true }
            );

            return {
                success: true,
                message: 'Categoría actualizada correctamente',
                data: updated,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al actualizar categoría:', error);
            return {
                success: false,
                message: 'Error inesperado al actualizar categoría',
            };
        }
    };



    deleteCategory = async (id) => {
        try {
            const deletedCategory = await Category.findByIdAndDelete(id);

            if (!deletedCategory) {
                return {
                    success: false,
                    message: 'Categoría no encontrada',
                };
            }

            // 🔥 Eliminar imagen de Cloudinary si existe
            if (
                deletedCategory.image &&
                deletedCategory.image.includes('res.cloudinary.com')
            ) {
                const publicId = this.getPublicIdFromUrl(deletedCategory.image);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                    console.log('🗑 Imagen de categoría eliminada de Cloudinary:', publicId);
                }
            }

            // 🔥 Eliminar imagen rectangular de Cloudinary si existe
            if (
                deletedCategory.imageWide &&
                deletedCategory.imageWide.includes('res.cloudinary.com')
            ) {
                const publicIdWide = this.getPublicIdFromUrl(deletedCategory.imageWide);
                if (publicIdWide) {
                    await cloudinary.uploader.destroy(publicIdWide);
                    console.log('🗑 Imagen rectangular de categoría eliminada de Cloudinary:', publicIdWide);
                }
            }

            return {
                success: true,
                message: 'Categoría eliminada exitosamente',
            };
        } catch (error) {
            console.error('❌ Servicio - Error al eliminar categoría:', error);
            return {
                success: false,
                message: 'Error inesperado al eliminar categoría',
            };
        }
    };

    getPublicIdFromUrl(url) {
        try {
            const parts = url.split('/');
            const fileWithExtension = parts[parts.length - 1];
            const [publicId] = fileWithExtension.split('.');
            const folder = parts[parts.length - 2];
            return `${folder}/${publicId}`;
        } catch {
            return null;
        }
    }
}
