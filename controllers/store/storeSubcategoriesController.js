import StoreSubcategoriesService from '../../services/store/storeSubcategories.service.js';

const storeSubcategoriesService = new StoreSubcategoriesService();

export default class StoreSubcategoriesController {
    getSubcategories = async (req, res) => {
        try {
            const { storeId, categoryId, page = 1, limit = 10 } = req.query;
            const response = await storeSubcategoriesService.getSubcategories({ storeId, categoryId, page, limit });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener subcategorías:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener subcategorías',
            });
        }
    };

    createSubcategory = async (req, res) => {
        try {
            const { name, storeId, categoryId } = req.body;
            const image = req.files?.image || null;

            const response = await storeSubcategoriesService.createSubcategory({ name, storeId, categoryId, image });
            return res.status(200).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al crear subcategoría:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado al crear subcategoría',
            });
        }
    };

    updateSubcategory = async (req, res) => {
        try {
            const { id } = req.params;
            const image = req.files?.image || null;
            const { name, storeId, categoryId } = req.body;

            const response = await storeSubcategoriesService.updateSubcategory(id, {
                name,
                storeId,
                categoryId,
                image
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al actualizar subcategoría:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al actualizar subcategoría',
            });
        }
    };

    deleteSubcategory = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await storeSubcategoriesService.deleteSubcategory(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al eliminar subcategoría:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al eliminar subcategoría',
            });
        }
    };
}
