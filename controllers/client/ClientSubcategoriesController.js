import ClientSubcategoriesService from '../../services/client/ClientSubcategories.service.js';

const clientSubcategoriesService = new ClientSubcategoriesService();

export default class ClientSubcategoriesController {
    getSubcategoriesByCategory = async (req, res) => {
        try {
            const { categoryId } = req.params;

            if (!categoryId) {
                return res.status(400).json({
                    success: false,
                    message: 'categoryId es requerido',
                });
            }

            const response = await clientSubcategoriesService.getSubcategoriesByCategory(categoryId);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener subcategorías:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener subcategorías',
            });
        }
    };
}
