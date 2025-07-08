import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

const complaintSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        mail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        complaint: {
            type: String,
            required: true,
            trim: true,
        },
        solved: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'editedAt' },
    }
);

// Plugins de paginación
complaintSchema.plugin(paginate);
complaintSchema.plugin(aggregatePaginate);

// Crear el modelo
const Complaints = mongoose.model('Complaints', complaintSchema);

export default Complaints;
