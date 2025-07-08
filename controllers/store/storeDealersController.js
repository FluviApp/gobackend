import StoreDealersService from '../../services/store/storeDealers.service.js';
const service = new StoreDealersService();

export default class StoreDealersController {
    getAllDealers = async (req, res) => {
        try {
            const { storeId, page = 1, limit = 10 } = req.query;
            const response = await service.getAllDealers({ storeId, page, limit });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error al obtener dealers' });
        }
    };

    getDealersByStoreId = async (req, res) => {
        try {
            const { storeId } = req.query;
            if (!storeId) {
                return res.status(400).json({ success: false, message: 'storeId es requerido' });
            }
            const response = await service.getDealersByStoreId(storeId);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error al obtener repartidores' });
        }
    };


    createDealer = async (req, res) => {
        try {
            const response = await service.createDealer(req.body);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error al crear dealer' });
        }
    };

    updateDealer = async (req, res) => {
        try {
            const response = await service.updateDealer(req.params.id, req.body);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error al actualizar dealer' });
        }
    };

    deleteDealer = async (req, res) => {
        try {
            const response = await service.deleteDealer(req.params.id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error al eliminar dealer' });
        }
    };
}

