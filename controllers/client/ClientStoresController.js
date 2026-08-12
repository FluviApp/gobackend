import ClientStoresService from '../../services/client/clientStores.service.js';

const clientStoresService = new ClientStoresService();

export default class ClientStoresController {
    getStoreByCode = async (req, res) => {
        try {
            const { code } = req.params;
            const response = await clientStoresService.getStoreByCode(code);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller - Error en getStoreByCode:', error);
            return res.status(500).json({ success: false, message: 'Error al buscar la tienda' });
        }
    };
}
