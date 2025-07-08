import connectMongoDB from '../../libs/mongoose.js';
import Category from '../../models/Category.js';
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
        try {
            let imagePath = '';

            if (data.image) {
                const uploadDir = path.join(process.cwd(), 'public/uploads/categories');
                const fileName = `${Date.now()}_${data.image.name}`;
                const fullPath = path.join(uploadDir, fileName);

                // Asegurarse que la carpeta existe
                fs.mkdirSync(uploadDir, { recursive: true });

                // Mover el archivo
                await data.image.mv(fullPath);

                // Este path sí corresponde a la carpeta estática
                imagePath = `/uploads/categories/${fileName}`;
                console.log('✔ Imagen guardada en:', fullPath);
                console.log('✔ Ruta pública:', imagePath);
            }

            const newCategory = new Category({
                name: data.name.trim(),
                image: imagePath,
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

            let imagePath = existing.image; // por defecto mantener imagen actual

            // ✅ Si hay una nueva imagen, la subimos y borramos la anterior
            if (categoryData.image) {
                const uploadDir = path.join(process.cwd(), 'public/uploads/categories');
                fs.mkdirSync(uploadDir, { recursive: true });

                const newFileName = `${Date.now()}_${categoryData.image.name}`;
                const newFullPath = path.join(uploadDir, newFileName);

                await categoryData.image.mv(newFullPath);
                imagePath = `/uploads/categories/${newFileName}`;

                // 🔥 Borrar imagen anterior si existe
                if (existing.image && existing.image.startsWith('/uploads')) {
                    const oldPath = path.join(process.cwd(), 'public', existing.image);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                        console.log('🗑 Imagen anterior eliminada:', oldPath);
                    }
                }
            }

            // Actualizamos los campos
            const updated = await Category.findByIdAndUpdate(id, {
                name: categoryData.name,
                storeId: categoryData.storeId,
                image: imagePath,
            }, { new: true });

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

            // 🔥 Eliminar imagen si existe
            if (deletedCategory.image && deletedCategory.image.startsWith('/uploads')) {
                const imagePath = path.join(process.cwd(), 'public', deletedCategory.image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log('🗑 Imagen de categoría eliminada:', imagePath);
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

}
