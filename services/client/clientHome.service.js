import connectMongoDB from '../../libs/mongoose.js';
import Banners from '../../models/Banners.js';
import Category from '../../models/Category.js';
import Packs from '../../models/Packs.js';
import Product from '../../models/Product.js';
import Order from '../../models/Orders.js';

export default class ClientHomeService {
    constructor() {
        connectMongoDB();
    }

    getHomeData = async (storeId) => {
        try {
            const [banners, categories, packs, mostSold, discounts] = await Promise.all([
                Banners.find({ storeId }).sort({ createdAt: -1 }).limit(5),
                Category.find({ storeId }).sort({ createdAt: -1 }).limit(10),
                Packs.find({ storeId }).sort({ createdAt: -1 }).limit(6),
                this.getMostSoldProducts(storeId),
                Product.find({ storeId, priceDiscount: { $gt: 0 } }).limit(10)
            ]);

            return {
                success: true,
                message: 'Contenido para home obtenido correctamente',
                data: {
                    banners,
                    categories,
                    packs,
                    mostSold,
                    discounts
                }
            };
        } catch (error) {
            console.error('❌ Servicio - Error en home:', error);
            return {
                success: false,
                message: 'Error inesperado al cargar contenido del inicio'
            };
        }
    };


    getMostSoldProducts = async (storeId) => {
        try {
            const pipeline = [
                { $match: { storeId } }, // 👈 Asegura que los pedidos sean de esa tienda
                { $unwind: '$products' },
                {
                    $group: {
                        _id: '$products.productId',
                        totalSold: { $sum: '$products.quantity' }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                { $unwind: '$product' },
                {
                    $replaceRoot: { newRoot: '$product' }
                }
            ];

            const result = await Order.aggregate(pipeline);
            return result;
        } catch (error) {
            console.error('❌ Error al calcular más vendidos:', error);
            return [];
        }
    };

}
