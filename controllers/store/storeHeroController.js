import StoreHeroService from '../../services/store/storeHero.service.js';

const storeHeroService = new StoreHeroService();

export default class StoreHeroController {
    getHero = async (req, res) => {
        try {
            const { storeId } = req.query;
            const response = await storeHeroService.getHero({ storeId });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - getHero:', error);
            return res.status(500).json({ success: false, message: 'Error inesperado al obtener el hero' });
        }
    };

    saveHero = async (req, res) => {
        try {
            const response = await storeHeroService.saveHero(req.body || {});
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - saveHero:', error);
            return res.status(500).json({ success: false, message: 'Error inesperado al guardar el hero' });
        }
    };
}
