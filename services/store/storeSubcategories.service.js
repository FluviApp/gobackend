import connectMongoDB from '../../libs/mongoose.js';
import Subcategory from '../../models/Subcategory.js';
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
            let imagePath = '';

            if (data.image) {
                const uploadDir = path.join(process.cwd(), 'public/uploads/subcategories');
                const fileName = `${Date.now()}_${data.image.name}`;
                const fullPath = path.join(uploadDir, fileName);

                fs.mkdirSync(uploadDir, { recursive: true });
                await data.image.mv(fullPath);

                imagePath = `/uploads/subcategories/${fileName}`;
                console.log('✔ Imagen subcategoría guardada en:', fullPath);
            }

            const newSubcategory = new Subcategory({
                name: data.name.trim(),
                image: imagePath,
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

            let imagePath = existing.image;

            if (data.image) {
                const uploadDir = path.join(process.cwd(), 'public/uploads/subcategories');
                fs.mkdirSync(uploadDir, { recursive: true });

                const fileName = `${Date.now()}_${data.image.name}`;
                const fullPath = path.join(uploadDir, fileName);

                await data.image.mv(fullPath);
                imagePath = `/uploads/subcategories/${fileName}`;

                // 🔥 Eliminar imagen anterior
                if (existing.image && existing.image.startsWith('/uploads')) {
                    const oldPath = path.join(process.cwd(), 'public', existing.image);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                        console.log('🗑 Imagen anterior eliminada:', oldPath);
                    }
                }
            }

            const updated = await Subcategory.findByIdAndUpdate(
                id,
                {
                    name: data.name,
                    storeId: data.storeId,
                    categoryId: data.categoryId,
                    image: imagePath,
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

            // 🧹 Eliminar imagen si existe
            if (subcategory.image && subcategory.image.startsWith('/uploads')) {
                const imagePath = path.join(process.cwd(), 'public', subcategory.image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log('🗑 Imagen de subcategoría eliminada:', imagePath);
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
}
