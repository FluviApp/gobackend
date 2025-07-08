import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const notificationSchema = new Schema(
    {
        storeId: {
            type: String,
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        body: {
            type: String,
            required: true,
            trim: true,
        },
        token: {
            type: String,
            default: '',
            trim: true,
        },
        url: {
            type: String,
            default: '',
            trim: true,
        },
        seen: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'editedAt' },
    }
);

notificationSchema.plugin(paginate);

const Notifications = mongoose.model('Notifications', notificationSchema);

export default Notifications;
