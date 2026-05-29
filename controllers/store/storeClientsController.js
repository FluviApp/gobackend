import StoreClientsService from '../../services/store/storeClients.service.js';

const storeClientsService = new StoreClientsService();

export default class StoreClientsController {
    getAllClients = async (req, res) => {
        try {
            const { storeId, page = 1, limit = 10 } = req.query;

            const response = await storeClientsService.getAllClients({ storeId, page, limit });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener clientes:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener clientes',
            });
        }
    };



    createClient = async (req, res) => {
        try {
            const response = await storeClientsService.createClient(req.body);

            return res.status(200).json(response);

        } catch (error) {
            console.error('❌ Controller - error inesperado:', error);

            const status = error.statusCode || 500;

            return res.status(status).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor'
            });
        }
    }


    updateClient = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await storeClientsService.updateClient(id, req.body);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al actualizar cliente:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al actualizar cliente',
            });
        }
    };

    deleteClient = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await storeClientsService.deleteClient(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al eliminar cliente:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al eliminar cliente',
            });
        }
    };

    getFilteredClients = async (req, res) => {
        try {
            const {
                storeId,
                zones,
                inactivityDays,
                registrationDateFrom,
                registrationDateTo,
                minSpent,
                maxSpent
            } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es obligatorio',
                });
            }

            const response = await storeClientsService.getFilteredClients({
                storeId,
                zones: zones ? zones.split(',') : [],
                inactivityDays: inactivityDays ? parseInt(inactivityDays) : null,
                registrationDateFrom: registrationDateFrom || null,
                registrationDateTo: registrationDateTo || null,
                minSpent: minSpent ? parseFloat(minSpent) : null,
                maxSpent: maxSpent ? parseFloat(maxSpent) : null,
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al filtrar clientes:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al filtrar clientes',
            });
        }
    };
}
