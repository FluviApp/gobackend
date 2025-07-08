import AdminStoresService from '../../services/admin/adminStores.service.js'
const AdminStores = new AdminStoresService()

export default class AdminStoresController {
    getAllStores = async (req, res) => {
        try {
            const { page, limit } = req.query;

            const response = await AdminStores.getAllStores({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
            });

            return res.status(200).json(response);

        } catch (error) {
            console.error('❌ Controller - error al obtener tiendas:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor',
            });
        }
    };

    createStore = async (req, res) => {
        try {
            const image = req.files?.image || null;
            if (!image) {
                return res.status(400).json({ success: false, message: 'La imagen es obligatoria' });
            }

            const response = await AdminStores.createStore({
                ...req.body,
                image,
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - error al crear tienda:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado al crear tienda',
            });
        }
    };


    updateStore = async (req, res) => {
        try {
            const storeId = req.params.id;
            const image = req.files?.image || null;

            const response = await AdminStores.updateStore(storeId, {
                ...req.body,
                image,
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - error al actualizar tienda:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado al actualizar la tienda',
            });
        }
    };


    deleteStore = async (req, res) => {
        try {
            const storeId = req.params.id;
            const response = await AdminStores.deleteStore(storeId);

            return res.status(response.success ? 200 : 400).json(response);

        } catch (error) {
            console.error('❌ Controller - error al eliminar tienda:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado al eliminar la tienda'
            });
        }
    };





}
