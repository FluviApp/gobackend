import ClientPacksService from '../../services/client/ClientPacksService.js';

const clientPacksService = new ClientPacksService();

export default class ClientPacksController {
    getPacksByStore = async (req, res) => {
        try {
            const { storeId } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es requerido',
                });
            }

            const response = await clientPacksService.getPacksByStoreId(storeId);

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ ClientPacksController - Error al obtener packs:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener packs',
            });
        }
    };
}
