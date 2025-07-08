import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const packProductSchema = new Schema({
    productId: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
    },
    price: {
        type: Number,
        required: true,
    },
    productImage: {
        type: String,
        required: true,
    },
}, { _id: false });

const packSchema = new Schema(
    {
        storeId: {
            type: String,
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            default: 0,
        },
        image: {
            type: String,
            required: true,
        },
        products: [packProductSchema],
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'editedAt' },
    }
);

packSchema.plugin(paginate);

const Packs = mongoose.model('Packs', packSchema);

export default Packs;
