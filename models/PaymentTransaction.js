import mongoose from 'mongoose';

const { Schema } = mongoose;

const PaymentTransactionSchema = new Schema({
    token: { type: String, required: true, unique: true },
    buyOrder: { type: String, required: true },
    sessionId: { type: String, required: true }, // puede ser userId
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    paymentMethod: { type: String, enum: ['webpay', 'mercadopago'], required: true, default: 'webpay' }, // Método de pago
    response: { type: Object },
    payload: { type: Object }, // Datos del pedido para crear automáticamente después del pago
    orderCreated: { type: Boolean, default: false }, // Flag para evitar crear el pedido dos veces
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // ID del pedido creado
    // Campos de cancelación/auditoría
    cancelledBy: { type: String, enum: ['user', 'system', 'gateway'], default: undefined },
    cancelledAt: { type: Date },
    cancelReason: { type: String }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

const PaymentTransaction = mongoose.model('PaymentTransaction', PaymentTransactionSchema);

export default PaymentTransaction;
