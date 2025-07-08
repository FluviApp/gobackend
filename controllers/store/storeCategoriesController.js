import StoreCategoriesService from '../../services/store/storeCategories.service.js';

const storeCategoriesService = new StoreCategoriesService();

export default class StoreCategoriesController {
    getAllCategories = async (req, res) => {
        try {
            const { storeId, page = 1, limit = 10 } = req.query;

            const response = await storeCategoriesService.getAllCategories({ storeId, page, limit });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener categorías:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener categorías',
            });
        }
    };

    createCategory = async (req, res) => {
        try {
            console.log('🟡 req.files:', req.files); // 👈🏼 Agrega esto
            const { name, storeId } = req.body;
            const image = req.files?.image || null;

            const response = await storeCategoriesService.createCategory({ name, storeId, image });
            return res.status(200).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al crear categoría:', error);
            const status = error.statusCode || 500;
            return res.status(status).json({
                success: false,
                message: error.message || 'Error inesperado al crear categoría',
            });
        }
    };


    updateCategory = async (req, res) => {
        try {
            const { id } = req.params;
            const image = req.files?.image || null;
            const { name, storeId } = req.body;

            const response = await storeCategoriesService.updateCategory(id, { name, storeId, image });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al actualizar categoría:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al actualizar categoría',
            });
        }
    };


    deleteCategory = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await storeCategoriesService.deleteCategory(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al eliminar categoría:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al eliminar categoría',
            });
        }
    };
}
