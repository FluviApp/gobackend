import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

// Subschema de productos en el pedido
const productSchema = new Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, required: true },
        name: { type: String, required: true },
        variant: { type: String },
        unitPrice: { type: Number, required: true },
        quantity: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        notes: { type: String },
        isPack: { type: Boolean, default: false },
        items: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId },
                name: { type: String },
                quantity: { type: Number },
            }
        ],
    },
    { _id: false }
);


// Subschema de horarios
const deliveryScheduleSchema = new Schema(
    {
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
        hour: { type: String },
    },
    { _id: false }
);

// Subschema de cliente
const customerSchema = new Schema(
    {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        address: { type: String },
        block: { type: String },
        lat: { type: Number },
        lon: { type: Number },
        observations: { type: String },
        notificationToken: { type: String },
    },
    { _id: false }
);

// Subschema de repartidor
const deliveryPersonSchema = new Schema(
    {
        id: { type: String },
        name: { type: String },
    },
    { _id: false }
);

// Subschema de calificación
const ratingSchema = new Schema(
    {
        value: { type: Number, min: 1, max: 5 },
        comment: { type: String },
    },
    { _id: false }
);

// Esquema principal del pedido
const orderSchema = new Schema(
    {
        storeId: { type: String, required: true },

        commerceId: { type: String, required: true }, // CAMBIO: String en vez de ObjectId

        origin: {
            type: String,
            enum: ['app', 'web', 'admin', 'pos'],
            required: true,
        },



        paymentMethod: {
            type: String,
            enum: ['efectivo', 'transferencia', 'webpay', 'mercadopago', 'tarjeta', 'otro'], // ✅ solo 'tarjeta'
            required: true,
        },
        transferPay: {
            type: Boolean,
            default: true,
        },


        status: {
            type: String,
            enum: [
                'pendiente',
                'confirmado',
                'preparando',
                'en_camino',
                'entregado',
                'retrasado',
                'devuelto',
                'cancelado',
            ],
            default: 'pendiente',
        },

        deliveryType: {
            type: String,
            enum: ['domicilio', 'retiro', 'mostrador'],
            required: true,
        },

        price: { type: Number, required: true },
        finalPrice: { type: Number },

        products: {
            type: [productSchema],
            required: true,
        },

        createdAt: { type: Date, default: Date.now },
        deliveryDate: { type: Date },

        deliverySchedule: deliveryScheduleSchema,
        customer: customerSchema,
        deliveryPerson: deliveryPersonSchema,

        merchantObservation: { type: String },
        deliveryObservation: { type: String },

        rating: ratingSchema,

        deliveredAt: { type: Date },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

// Plugins de paginación
orderSchema.plugin(paginate);
orderSchema.plugin(aggregatePaginate);

// ⚠️ Importante: forzar uso de la colección 'order'
const Order = mongoose.model('Order', orderSchema, 'order');

export default Order;
