import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const dealerSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        mail: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        storeId: { type: String, required: true },
        zoneId: { type: String, default: '' },
    },
    { timestamps: true }
);

dealerSchema.plugin(mongoosePaginate);

const Dealers = mongoose.model('Dealer', dealerSchema);
export default Dealers;