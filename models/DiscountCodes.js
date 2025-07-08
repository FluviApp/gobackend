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
