import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

const commerceSchema = new Schema(
    {
        active: {
            type: Boolean,
            default: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        mail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        logo: {
            type: String,
            trim: true,
        },
        social: {
            type: Object,
            default: {},
        },
        isPaymentActive: {
            type: Boolean,
            default: true,
        },
        appVersion: {
            type: String,
            default: '1.0.0',
        },
        ecommerceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store', // Asegúrate que esta sea la colección/modelo correcto
            required: false, // Cambia a `true` si debe ser obligatorio
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

// Plugins de paginación
commerceSchema.plugin(paginate);
commerceSchema.plugin(aggregatePaginate);

// ⚠️ Importante: forzar uso de la colección 'commerce'
const Commerce = mongoose.model('Commerce', commerceSchema, 'commerce');

export default Commerce;
