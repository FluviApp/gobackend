import ClientProductsService from '../../services/client/ClientProducts.service.js';

const clientProductsService = new ClientProductsService();

export default class ClientProductsController {

    searchStoreProducts = async (req, res) => {
        try {
            const {
                q = '',
                search = '',
                storeId,
                page = 1,
                limit = 20,
                categoryId,
                subcategoryId,
                priceMin,
                priceMax,
                available,
                sort = 'relevance'
            } = req.query;

            console.log('📥 [ClientProductsController.search] query:', {
                q: q || search,
                storeId,
                page,
                limit,
                categoryId,
                subcategoryId,
                priceMin,
                priceMax,
                available,
                sort
            });

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es requerido'
                });
            }

            const response = await clientProductsService.searchStoreProducts({
                storeId,
                q: q || search,
                page: parseInt(page, 10) || 1,
                limit: Math.min(parseInt(limit, 10) || 20, 50),
                categoryId,
                subcategoryId,
                priceMin: priceMin != null ? Number(priceMin) : undefined,
                priceMax: priceMax != null ? Number(priceMax) : undefined,
                available: typeof available === 'string' ? available === 'true' : undefined,
                sort
            });

            console.log('✅ [ClientProductsController.search] response meta:', {
                success: response?.success,
                message: response?.message,
                total: response?.data?.total,
                count: response?.data?.items?.length,
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error en búsqueda de productos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al buscar productos'
            });
        }
    };
    getProductById = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await clientProductsService.getProductById(id);

            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener producto por ID:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener producto'
            });
        }
    };

    getProductsByCategory = async (req, res) => {

        try {
            const { categoryId } = req.params;


            if (!categoryId) {
                return res.status(400).json({
                    success: false,
                    message: 'categoryId es requerido',
                });
            }

            const response = await clientProductsService.getProductsByCategory(categoryId);

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener productos por categoría:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener productos por categoría',
            });
        }
    };
    getProductsBySubcategory = async (req, res) => {
        try {
            const { subcategoryId } = req.params;

            if (!subcategoryId) {
                return res.status(400).json({
                    success: false,
                    message: 'subcategoryId es requerido',
                });
            }

            const response = await clientProductsService.getProductsBySubcategory(subcategoryId);

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener productos por subcategoría:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener productos por subcategoría',
            });
        }
    };




}
