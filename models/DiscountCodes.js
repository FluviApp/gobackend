// src/models/DiscountCodes.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const DiscountCodesSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    code: {
        type: String,
        required: [true, 'El código es obligatorio'],
        unique: true,
        uppercase: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['percent', 'fixed'],
        default: 'percent'
    },
    value: {
        type: Number,
        default: 0,
        min: 0
    },
    minAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxUses: {
        type: Number,
        default: 0,
        min: 0
    },
    perUserLimit: {
        type: Number,
        default: 0,
        min: 0
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    expiresAt: {
        type: Date,
        default: null
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // createdAt y updatedAt
});

DiscountCodesSchema.plugin(mongoosePaginate);

const DiscountCodes = mongoose.model('DiscountCodes', DiscountCodesSchema);

export default DiscountCodes;
