import ClientHomeService from '../../services/client/clientHome.service.js';

const clientHomeService = new ClientHomeService();

export default class ClientHomeController {
    getHomeData = async (req, res) => {
        try {
            const { storeId } = req.query;
            const response = await clientHomeService.getHomeData(storeId);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error en home:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al cargar el inicio'
            });
        }
    };

}
