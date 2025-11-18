import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

const variantSchema = new Schema({
    price: { type: Number, required: true },
    priceDiscount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    images: [{ type: String }],
    // No más color, size, etc.
}, { strict: false }); // 💡 habilita campos dinámicos


const productSchema = new Schema(
    {
        storeId: {
            type: String,
            required: true,
            index: true
        },
        categoryIds: [{
            type: mongoose.Types.ObjectId,
            ref: 'Category',
        }],
        subcategoryIds: [{
            type: mongoose.Types.ObjectId,
            ref: 'Subcategory',
        }],
        name: {
            type: String,
            required: true,
            trim: true,
        },
        detail: {
            type: String,
            default: '',
        },
        priceBase: {
            type: Number,
            default: 0,
        },
        priceDiscount: {
            type: Number,
            default: 0,
        },
        images: [{ type: String }], // general product images (optional)
        variants: [variantSchema],
        isFeatured: {
            type: Boolean,
            default: false,
        },
        available: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'editedAt' },
    }
);

// Índices para búsqueda y rendimiento
// Índice de texto para relevancia en nombre y detalle
productSchema.index(
    { name: 'text', detail: 'text' },
    {
        weights: { name: 5, detail: 1 },
        name: 'ProductTextIndex',
        default_language: 'spanish'
    }
);
// Índices comunes usados en filtros/orden
productSchema.index({ storeId: 1, available: 1 });
productSchema.index({ storeId: 1, priceBase: 1 });
productSchema.index({ storeId: 1, createdAt: -1 });

productSchema.plugin(paginate);
productSchema.plugin(aggregatePaginate);

const Product = mongoose.model('Product', productSchema);

export default Product;