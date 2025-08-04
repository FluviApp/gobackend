import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2'; // 👈 plugin de paginación

const { Schema } = mongoose;

const passwordResetTokenSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Client'
        },
        token: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        expiresAt: {
            type: Date,
            required: true
        },
        used: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    }
);

// ✅ Agregar paginación si en el futuro necesitas listar tokens (auditoría, admin, etc.)
passwordResetTokenSchema.plugin(mongoosePaginate);

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

export default PasswordResetToken;
