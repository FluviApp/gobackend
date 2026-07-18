import connectMongoDB from '../../libs/mongoose.js';
import HeroConfig from '../../models/HeroConfig.js';

export default class StoreHeroService {
    constructor() {
        connectMongoDB();
    }

    getHero = async ({ storeId }) => {
        try {
            if (!storeId) return { success: false, message: 'storeId requerido' };
            const hero = await HeroConfig.findOne({ storeId }).lean();
            return { success: true, message: 'Hero obtenido', data: hero || null };
        } catch (error) {
            console.error('❌ Servicio - getHero:', error);
            return { success: false, message: 'Error inesperado al obtener el hero' };
        }
    };

    saveHero = async (data) => {
        try {
            const { storeId, title, subtitle, ctaLabel, targetType, targetId, enabled } = data;
            if (!storeId) return { success: false, message: 'storeId requerido' };

            const update = {
                title: (title || '').trim(),
                subtitle: (subtitle || '').trim(),
                ctaLabel: (ctaLabel || 'Ver').trim(),
                targetType: ['product', 'pack'].includes(targetType) ? targetType : '',
                targetId: targetId || '',
                enabled: enabled !== false,
            };

            const hero = await HeroConfig.findOneAndUpdate(
                { storeId },
                { $set: update, $setOnInsert: { storeId } },
                { new: true, upsert: true }
            );

            return { success: true, message: 'Hero guardado correctamente', data: hero };
        } catch (error) {
            console.error('❌ Servicio - saveHero:', error);
            return { success: false, message: 'Error inesperado al guardar el hero' };
        }
    };
}
