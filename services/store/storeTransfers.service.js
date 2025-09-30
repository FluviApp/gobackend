// Services/store/StoreOrders.service.js
import mongoose from 'mongoose';
import connectMongoDB from '../../libs/mongoose.js';
import Order from '../../models/Orders.js';

const { ObjectId } = mongoose.Types;

function buildStoreIdFilter(id) {
    // Soporta DB donde storeId es ObjectId o string
    const s = String(id);
    if (ObjectId.isValid(s)) {
        return { $in: [new ObjectId(s), s] };
    }
    return s;
}

export default class StoreOrdersService {
    constructor() { connectMongoDB(); }

    /**
     * Lista todas las órdenes de un store.
     * @param {string} storeId (requerido)
     * @param {number} page (opcional, default 1)
     * @param {number} limit (opcional, default 200, máx 1000)
     * @param {string} sort (opcional, default '-createdAt')
     */
    async listByStore({ storeId, page = 1, limit = 200, sort = '-createdAt' }) {
        try {
            if (!storeId) return { success: false, message: 'storeId es requerido' };

            const pg = Math.max(1, Number(page) || 1);
            const lm = Math.min(1000, Math.max(1, Number(limit) || 200));
            const skip = (pg - 1) * lm;

            const storeIdFilter = buildStoreIdFilter(storeId);
            const query = { storeId: storeIdFilter };

            const [total, orders] = await Promise.all([
                Order.countDocuments(query),
                Order.find(query)
                    .sort(sort) // '-createdAt' desc por defecto
                    .skip(skip)
                    .limit(lm)
                    .select({
                        // Proyección típica; ajusta a gusto
                        _id: 1,
                        storeId: 1,
                        origin: 1,
                        paymentMethod: 1,
                        transferPay: 1,
                        status: 1,
                        deliveryType: 1,
                        finalPrice: 1,
                        price: 1,
                        products: 1,
                        customer: 1,
                        deliveryPerson: 1,
                        deliveryDate: 1,
                        deliveredAt: 1,
                        createdAt: 1,
                        updatedAt: 1,
                    })
                    .lean()
            ]);

            return {
                success: true,
                message: 'Órdenes listadas correctamente',
                data: {
                    storeId: String(storeId),
                    pagination: {
                        page: pg,
                        limit: lm,
                        total,
                        pages: Math.ceil(total / lm) || 1
                    },
                    orders
                }
            };
        } catch (err) {
            console.error('❌ listByStore error:', err);
            return { success: false, message: 'Error al listar órdenes por storeId' };
        }
    }
}
