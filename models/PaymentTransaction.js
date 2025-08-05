import mongoose from 'mongoose';

const { Schema } = mongoose;

const PaymentTransactionSchema = new Schema({
    token: { type: String, required: true, unique: true },
    buyOrder: { type: String, required: true },
    sessionId: { type: String, required: true }, // puede ser userId
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    response: { type: Object }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

const PaymentTransaction = mongoose.model('PaymentTransaction', PaymentTransactionSchema);

export default PaymentTransaction;
