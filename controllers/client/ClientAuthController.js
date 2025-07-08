import ClientAuthService from '../../services/client/ClientAuthService.js';

const ClientAuth = new ClientAuthService();

export default class ClientAuthController {
    login = async (req, res) => {
        try {
            const response = await ClientAuth.login(req.body);
            const status = response.success ? 200 : 401;
            return res.status(status).json(response);
        } catch (error) {
            console.error('❌ ClientAuthController - error en login:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor',
            });
        }
    };
    register = async (req, res) => {
        try {
            const response = await ClientAuth.register(req.body);
            const status = response.success ? 201 : 400;
            return res.status(status).json(response);
        } catch (error) {
            console.error('❌ ClientAuthController - error en register:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor',
            });
        }
    };

    recoverPassword = async (req, res) => {
        try {
            const response = await ClientAuth.recoverPassword(req.body);
            const status = response.success ? 200 : 404;
            return res.status(status).json(response);
        } catch (error) {
            console.error('❌ ClientAuthController - error en recoverPassword:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor',
            });
        }
    };
    getClientById = async (req, res) => {
        try {
            const { id } = req.params;
            const client = await ClientAuth.getClientById(id);

            if (!client) {
                return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
            }

            return res.status(200).json({ success: true, data: client });
        } catch (error) {
            console.error('❌ Error en getClientById:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener cliente' });
        }
    };

    getClientByEmail = async (req, res) => {
        try {
            const { email } = req.params;
            const client = await ClientAuth.getClientByEmail(email);

            if (!client) {
                return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
            }

            return res.status(200).json({ success: true, data: client });
        } catch (error) {
            console.error('❌ ClientAuthController - error en getClientByEmail:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener cliente por email' });
        }
    };


    updateClient = async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const updatedClient = await ClientAuth.updateClient(id, updateData);

            if (!updatedClient) {
                return res.status(404).json({ success: false, message: 'Cliente no encontrado o no se pudo actualizar' });
            }

            return res.status(200).json({ success: true, data: updatedClient });
        } catch (error) {
            console.error('❌ ClientAuthController - error en updateClient:', error);
            return res.status(500).json({ success: false, message: 'Error al actualizar cliente' });
        }
    };


}
