import StoreEmailsService from '../../services/store/storeEmails.service.js';

const storeEmailsService = new StoreEmailsService();

export default class StoreEmailsController {
    getAllEmails = async (req, res) => {
        try {
            const { storeId, page = 1, limit = 10 } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es obligatorio',
                });
            }

            const response = await storeEmailsService.getAllEmails({
                storeId,
                page: parseInt(page),
                limit: parseInt(limit),
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener correos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener correos',
            });
        }
    };

    sendEmail = async (req, res) => {
        try {
            const { storeId, recipientEmail, recipientName, subject, message } = req.body;

            if (!storeId || !recipientEmail || !subject || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId, recipientEmail, subject y message son obligatorios',
                });
            }

            const response = await storeEmailsService.sendCustomEmail({
                storeId,
                recipientEmail,
                recipientName,
                subject,
                message,
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al enviar correo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al enviar correo',
            });
        }
    };

    sendEmailToMultiple = async (req, res) => {
        try {
            const { storeId, clientIds, subject, message } = req.body;

            if (!storeId || !clientIds || !Array.isArray(clientIds) || clientIds.length === 0 || !subject || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId, clientIds (array), subject y message son obligatorios',
                });
            }

            const response = await storeEmailsService.sendEmailToMultipleClients({
                storeId,
                clientIds,
                subject,
                message,
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al enviar correos múltiples:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al enviar correos',
            });
        }
    };

    deleteEmail = async (req, res) => {
        try {
            const { id } = req.params;

            const response = await storeEmailsService.deleteEmail(id);

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al eliminar correo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al eliminar correo',
            });
        }
    };
}
