import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const bannerSchema = new Schema(
    {
        storeId: {
            type: String,
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            required: true,
        },
        link: {
            type: String,
            default: '',
            trim: true,
        },
    },
    {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'editedAt',
        },
    }
);

bannerSchema.plugin(paginate);

const Banners = mongoose.model('Banners', bannerSchema);

export default Banners;
