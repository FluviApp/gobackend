// models/Comunas.js
// Catálogo de comunas con su límite (polígono). Se guarda UNA sola vez y las
// zonas de las tiendas apuntan a la comuna por `slug` (sin duplicar coordenadas).
import mongoose from 'mongoose';

const { Schema } = mongoose;

const pointSchema = new Schema(
    {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    { _id: false }
);

const bboxSchema = new Schema(
    {
        latMin: Number,
        latMax: Number,
        lngMin: Number,
        lngMax: Number,
    },
    { _id: false }
);

const comunaSchema = new Schema(
    {
        // Nombre normalizado: sin tildes, minúsculas, con guiones. Ej: 'penalolen', 'nunoa', 'puente-alto'
        slug: { type: String, required: true, unique: true, index: true, trim: true },
        name: { type: String, required: true, trim: true },
        region: { type: String, default: '' },
        bbox: { type: bboxSchema, default: () => ({}) },
        polygon: { type: [pointSchema], default: [] },
    },
    { timestamps: true }
);

const Comunas = mongoose.model('Comuna', comunaSchema);
export default Comunas;
