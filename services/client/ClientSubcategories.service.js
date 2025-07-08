import connectMongoDB from '../../libs/mongoose.js';
import mongoose from 'mongoose';
import Subcategory from '../../models/Subcategory.js';

export default class ClientSubcategoriesService {
    constructor() {
        connectMongoDB();
    }

    getSubcategoriesByCategory = async (categoryId) => {
        try {
            console.log('📥 categoryId recibido en subcategorías:', categoryId);
            console.log('📦 typeof categoryId:', typeof categoryId);

            // ✅ Usa directamente el categoryId para ver si los datos se guardaron como string
            const subcategories = await Subcategory.find({
                categoryId: categoryId
            }).sort({ createdAt: -1 });

            console.log('📦 Subcategorías encontradas:', subcategories.length);

            return {
                success: true,
                message: 'Subcategorías obtenidas correctamente',
                data: subcategories
            };
        } catch (error) {
            console.error('❌ Servicio - getSubcategoriesByCategory:', error);
            return {
                success: false,
                message: error.message || 'Error inesperado al obtener subcategorías'
            };
        }
    };

}
