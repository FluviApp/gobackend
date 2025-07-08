import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

// Definir el esquema de la tienda
const storeSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        admin: {
            sub: {
                type: String,
                required: true,
            },
            email: {
                type: String,
                required: true,
            },
            name: {
                type: String,
                required: true,
            }
        },
        holiday: {
            type: String,
            required: true,
            trim: true,
        },
        paymentmethod: {
            type: [String],
            required: true,
        },
        schedules: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        availableInMarketplace: {
            type: Boolean,
            required: true,
            default: false,
        },

    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'editedAt' },
    }
);

// Aplicar plugins
storeSchema.plugin(paginate);
storeSchema.plugin(aggregatePaginate);

// Crear el modelo Store
const Stores = mongoose.model('Stores', storeSchema);

export default Stores;
