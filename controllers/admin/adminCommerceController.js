import AdminCommerceService from '../../services/admin/adminCommerce.service.js';
const AdminCommerce = new AdminCommerceService();

export default class AdminCommerceController {

    login = async (req, res) => {
        try {
            const response = await AdminCommerce.login(req.body);

            const status = response.success ? 200 : 401;
            return res.status(status).json(response);

        } catch (error) {
            console.error('❌ Controller - error en login:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor'
            });
        }
    };

    getCommerceById = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await AdminCommerce.getCommerceById(id);

            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller - error al obtener comercio por ID:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor',
            });
        }
    };


    getAllCommerces = async (req, res) => {
        try {
            const { page, limit } = req.query;

            const response = await AdminCommerce.getAllCommerces({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
            });

            return res.status(200).json(response);

        } catch (error) {
            console.error('❌ Controller - error al obtener comercios:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor',
            });
        }
    };

    createCommerce = async (req, res) => {
        try {
            const response = await AdminCommerce.createCommerce(req.body);

            return res.status(200).json(response);

        } catch (error) {
            console.error('❌ Controller - error inesperado al crear comercio:', error);

            const status = error.statusCode || 500;

            return res.status(status).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor',
            });
        }
    };

    updateCommerce = async (req, res) => {
        try {
            const commerceId = req.params.id;
            const updatedData = req.body;

            const response = await AdminCommerce.updateCommerce(commerceId, updatedData);

            return res.status(response.success ? 200 : 400).json(response);

        } catch (error) {
            console.error('❌ Controller - error al actualizar comercio:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado al actualizar el comercio',
            });
        }
    };

    deleteCommerce = async (req, res) => {
        try {
            const commerceId = req.params.id;

            const response = await AdminCommerce.deleteCommerce(commerceId);

            return res.status(response.success ? 200 : 400).json(response);

        } catch (error) {
            console.error('❌ Controller - error al eliminar comercio:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado al eliminar el comercio',
            });
        }
    };
}
