import connectMongoDB from '../../libs/mongoose.js';
import mongoose from 'mongoose';
import Product from '../../models/Product.js';

export default class ClientProductsService {
    constructor() {
        connectMongoDB();
    }

    searchStoreProducts = async ({ storeId, search = '' }) => {
        try {
            const query = { storeId };

            if (search) {
                query.name = { $regex: new RegExp(search, 'i') };
            }

            const results = await Product.find(query)
                .sort({ createdAt: -1 })
                .limit(15);

            return {
                success: true,
                message: 'Productos encontrados',
                data: results
            };
        } catch (error) {
            console.error('❌ Servicio - Error en búsqueda de productos:', error);
            return {
                success: false,
                message: 'Error inesperado al buscar productos'
            };
        }
    };

    getProductById = async (id) => {
        try {
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('ID de producto inválido');
            }

            const product = await Product.findById(id);

            if (!product) {
                return {
                    success: false,
                    message: 'Producto no encontrado'
                };
            }

            return {
                success: true,
                message: 'Producto encontrado',
                data: product
            };
        } catch (error) {
            console.error('❌ Servicio - getProductById:', error);
            return {
                success: false,
                message: error.message || 'Error inesperado al obtener producto por ID'
            };
        }
    };

    getProductsByCategory = async (categoryId) => {
        try {

            if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
                throw new Error('categoryId inválido');
            }

            const products = await Product.find({
                categoryIds: new mongoose.Types.ObjectId(categoryId)
            }).sort({ createdAt: -1 });

            return {
                success: true,
                message: 'Productos filtrados por categoría correctamente',
                data: products
            };
        } catch (error) {
            console.error('❌ Servicio - getProductsByCategory:', error);
            return {
                success: false,
                message: error.message || 'Error inesperado al obtener productos por categoría'
            };
        }
    };
    getProductsBySubcategory = async (subcategoryId) => {
        try {


            if (!subcategoryId || !mongoose.Types.ObjectId.isValid(subcategoryId)) {
                throw new Error('subcategoryId inválido');
            }

            const products = await Product.find({
                subcategoryIds: new mongoose.Types.ObjectId(subcategoryId)
            }).sort({ createdAt: -1 });

            return {
                success: true,
                message: 'Productos filtrados por subcategoría correctamente',
                data: products
            };
        } catch (error) {
            console.error('❌ Servicio - getProductsBySubcategory:', error);
            return {
                success: false,
                message: error.message || 'Error inesperado al obtener productos por subcategoría'
            };
        }
    };



}

