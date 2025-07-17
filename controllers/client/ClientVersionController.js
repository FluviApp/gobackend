import ClientVersionService from '../../services/client/clientVersion.service.js';

const clientVersionService = new ClientVersionService();

export default class ClientVersionController {
    getAppVersion = async (req, res) => {
        try {
            const versionData = await clientVersionService.getMinimumVersionInfo();
            return res.status(200).json(versionData);
        } catch (error) {
            console.error('❌ Error en ClientVersionController:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener la versión mínima requerida',
            });
        }
    };
}
