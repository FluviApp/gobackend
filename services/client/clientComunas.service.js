import Comunas from '../../models/Comunas.js';

export default class ClientComunasService {
    // Lista liviana para el dropdown del admin (sin el polígono).
    list = async () => {
        const comunas = await Comunas.find({}, { slug: 1, name: 1, region: 1, bbox: 1, _id: 0 })
            .sort({ name: 1 })
            .lean();
        return { success: true, data: comunas };
    };

    // Comuna con su polígono (para dibujar en el mapa).
    getBySlug = async (slug) => {
        const comuna = await Comunas.findOne({ slug }, { _id: 0 }).lean();
        if (!comuna) return { success: false, message: 'Comuna no encontrada' };
        return { success: true, data: comuna };
    };
}
