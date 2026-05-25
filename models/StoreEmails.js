import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const storeEmailSchema = new Schema(
    {
        storeId: {
            type: String,
            required: true,
            index: true,
        },
        recipientEmail: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        recipientName: {
            type: String,
            trim: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'failed'],
            default: 'pending',
            index: true,
        },
        errorMessage: {
            type: String,
            default: '',
        },
        sentAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'editedAt' },
    }
);

storeEmailSchema.plugin(paginate);

const StoreEmails = mongoose.model('StoreEmails', storeEmailSchema);

export default StoreEmails;
