// src/models/DiscountCodeUsages.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const DiscountCodeUsagesSchema = new mongoose.Schema({
    codeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DiscountCodes',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    usedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

DiscountCodeUsagesSchema.index({ codeId: 1, email: 1 });
DiscountCodeUsagesSchema.index({ codeId: 1, userId: 1 });

DiscountCodeUsagesSchema.plugin(mongoosePaginate);

const DiscountCodeUsages = mongoose.model('DiscountCodeUsages', DiscountCodeUsagesSchema);

export default DiscountCodeUsages;
