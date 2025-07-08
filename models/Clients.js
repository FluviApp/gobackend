import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2'; // 👈 importa el plugin

const { Schema } = mongoose;

const clientSchema = new Schema(
    {
        name: {
            type: String,
            required: false,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        address: {
            type: String,
            trim: true
        },
        block: {
            type: String,
            trim: true
        },
        lat: {
            type: Number
        },
        lon: {
            type: Number
        },
        phone: {
            type: String,
            trim: true
        },
        verified: {
            type: Boolean,
            default: false
        },
        token: {
            type: String,
            default: ''
        },
        device: {
            type: String,
            default: '',
            trim: true
        },
        version: {
            type: String,
            default: '',
            trim: true
        },
        storeId: {
            type: String,
            required: true
        },
        resetToken: { type: String },
        resetTokenExpires: { type: Date },

    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

// ✅ Aplica el plugin de paginación
clientSchema.plugin(mongoosePaginate);

const Clients = mongoose.model('Client', clientSchema);

export default Clients;
