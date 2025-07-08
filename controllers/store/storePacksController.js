import StorePacksService from '../../services/store/storePacks.service.js';

const storePacksService = new StorePacksService();

export default class StorePacksController {
    getAllPacks = async (req, res) => {
        try {
            const { storeId } = req.query;

            const response = await storePacksService.getAllPacks({ storeId });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener packs:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener packs',
            });
        }
    };

    createPack = async (req, res) => {
        try {
            const response = await storePacksService.createPack(req.body, req.files);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al crear pack:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al crear pack',
            });
        }
    };

    updatePack = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await storePacksService.updatePack(id, req.body, req.files);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al actualizar pack:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al actualizar pack',
            });
        }
    };

    deletePack = async (req, res) => {
        try {
            const { id } = req.params;

            const response = await storePacksService.deletePack(id);

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al eliminar pack:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al eliminar pack',
            });
        }
    };
}
