import ClientAppStatusService from '../../services/client/clientAppStatus.service.js';

const clientAppStatusService = new ClientAppStatusService();

export default class ClientAppStatusController {
    getAppStatus = async (req, res) => {
        try {

            const response = await clientAppStatusService.getAppStatus();

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener estado de app:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener estado de app',
            });
        }
    };

    getStoreData = async (req, res) => {
        try {
            const { storeId } = req.params;
            const response = await clientAppStatusService.getStoreData(storeId);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener datos de tienda:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener datos de tienda',
            });
        }
    };
}
