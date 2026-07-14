import ClientComunasService from '../../services/client/clientComunas.service.js';

const clientComunasService = new ClientComunasService();

export default class ClientComunasController {
    list = async (req, res) => {
        try {
            const response = await clientComunasService.list();
            return res.status(200).json(response);
        } catch (error) {
            console.error('❌ Controller - Error en list comunas:', error);
            return res.status(500).json({ success: false, message: 'Error al listar comunas' });
        }
    };

    getBySlug = async (req, res) => {
        try {
            const response = await clientComunasService.getBySlug(req.params.slug);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller - Error en getBySlug comuna:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener comuna' });
        }
    };
}
