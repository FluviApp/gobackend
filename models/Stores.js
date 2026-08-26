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
        // Código único de la tienda (nombre + sufijo). Los clientes lo usan para
        // entrar directo a esta marca en la app (por código o QR). Visible en Ajustes.
        code: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            uppercase: true,
            index: true,
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
        payment: {
            type: Boolean,
            required: true,
            default: true,
        },
        // Recargos por método de pago: { tarjeta: { type: 'percent', value: 3.5 }, webpay: { type: 'fixed', value: 500 }, ... }
        paymentFees: {
            type: Schema.Types.Mixed,
            default: {},
        },
        taxPercent: {
            type: Number,
            default: 19,
            min: 0,
        },
        transferWhatsappMessage: {
            type: String,
            default: '',
            trim: true,
        },
        deliverOnHolidays: {
            type: Boolean,
            default: true,
        },
        blockedDates: {
            type: [Date],
            default: [],
        },

        // Modo de entrega por marca. Define cómo elige el cliente el horario:
        //   slots_chicos  -> bloques de 1 hora (default; comportamiento histórico)
        //   slots_grandes -> bloques amplios definidos por la tienda (ej. "10:00 - 12:00")
        //   sin_horario   -> el cliente no elige hora (día opcional); se avisa por estado
        deliveryMode: {
            type: String,
            enum: ['slots_chicos', 'slots_grandes', 'sin_horario'],
            default: 'slots_chicos',
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
