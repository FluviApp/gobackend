// scripts/seedComunas.js
// Siembra/actualiza el catálogo de comunas desde data/comunas-rm.json.
// Idempotente: hace upsert por `slug`, así se puede correr varias veces.
// Uso:  node scripts/seedComunas.js
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import path from 'path';
import connectMongoDB from '../libs/mongoose.js';
import Comunas from '../models/Comunas.js';

const run = async () => {
    await connectMongoDB();

    const file = path.join(process.cwd(), 'data', 'comunas-rm.json');
    const list = JSON.parse(readFileSync(file, 'utf8'));

    let upserted = 0;
    for (const c of list) {
        if (!c?.slug || !Array.isArray(c?.polygon) || c.polygon.length < 3) {
            console.warn('⚠️  Saltada (sin polígono válido):', c?.name || c?.slug);
            continue;
        }
        await Comunas.updateOne(
            { slug: c.slug },
            { $set: { slug: c.slug, name: c.name, region: c.region || '', bbox: c.bbox || {}, polygon: c.polygon } },
            { upsert: true }
        );
        upserted++;
    }

    const total = await Comunas.countDocuments();
    console.log(`✅ Comunas sembradas/actualizadas: ${upserted}. Total en la colección: ${total}`);
    await mongoose.disconnect();
    process.exit(0);
};

run().catch((e) => {
    console.error('❌ Error al sembrar comunas:', e);
    process.exit(1);
});
