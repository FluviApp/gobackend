import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

const subcategorySchema = new Schema(
    {
        categoryId: {
            type: mongoose.Types.ObjectId,
            ref: 'Category',
            required: true,
            index: true
        },
        storeId: {
            type: String,
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            default: ''
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'editedAt' },
    }
);

subcategorySchema.plugin(paginate);
subcategorySchema.plugin(aggregatePaginate);

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

export default Subcategory;
