import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

// Definir el esquema del usuario
const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        mail: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        role: {
            type: String,
            required: true,
            enum: ['user', 'admin'],
            default: 'user',
        },
        storeId: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'editedAt' },
    }
);

// Aplicar plugins
userSchema.plugin(paginate);
userSchema.plugin(aggregatePaginate);

// Crear el modelo User
const User = mongoose.model('User', userSchema);

export default User;
