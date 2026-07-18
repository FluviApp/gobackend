import mongoose from 'mongoose';

const { Schema } = mongoose;

// Configuración del hero del home (una por tienda). Texto + destino (producto o pack).
const heroConfigSchema = new Schema(
    {
        storeId: { type: String, required: true, unique: true, index: true },
        title: { type: String, default: '', trim: true },
        subtitle: { type: String, default: '', trim: true },
        ctaLabel: { type: String, default: 'Ver', trim: true },
        targetType: { type: String, enum: ['product', 'pack', ''], default: '' },
        targetId: { type: String, default: '' },
        enabled: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const HeroConfig = mongoose.model('HeroConfig', heroConfigSchema);

export default HeroConfig;
