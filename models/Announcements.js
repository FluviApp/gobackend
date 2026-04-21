import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const announcementSchema = new Schema(
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
        message: {
            type: String,
            required: true,
            trim: true,
        },
        imageUrl: {
            type: String,
            default: '',
            trim: true,
        },
        imagePublicId: {
            type: String,
            default: '',
            trim: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'editedAt' },
    }
);

announcementSchema.plugin(paginate);

const Announcements = mongoose.model('Announcements', announcementSchema);

export default Announcements;
