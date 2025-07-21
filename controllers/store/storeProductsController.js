import StoreProductsService from '../../services/store/storeProducts.service.js';

const storeProductsService = new StoreProductsService();

export default class StoreProductsController {
    getAllProducts = async (req, res) => {
        try {
            const { categoryId, subcategoryId, page = 1, limit = 10 } = req.query;

            let storeIds = [];

            if (Array.isArray(req.query.storeId)) {
                storeIds = req.query.storeId;
            } else if (typeof req.query.storeId === 'string') {
                storeIds = req.query.storeId.split(',').map(id => id.trim());
            }

            // ✅ Tomamos el primero (asumiendo una tienda por sesión)
            const storeId = storeIds[0];

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es requerido'
                });
            }

            const response = await storeProductsService.getAllProducts({
                storeId,
                categoryId,
                subcategoryId,
                page,
                limit,
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener productos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener productos',
            });
        }
    };

    getAllProductsForSelect = async (req, res) => {
        try {
            const { storeId, search = '', limit = 50 } = req.query;

            if (!storeId) {
                return res.status(400).json({ success: false, message: 'storeId es requerido' });
            }

            const result = await storeProductsService.getAllProductsForSelect({ storeId, search, limit });
            return res.status(200).json({
                success: true,
                message: 'Productos y packs cargados correctamente',
                data: result
            });
        } catch (error) {
            console.error('❌ Error en getAllProductsForSelect:', error);
            return res.status(500).json({ success: false, message: 'Error al cargar productos' });
        }
    };


    getAllProductsUnfiltered = async (req, res) => {
        try {
            const { page = 1, limit = 10, search = '', storeId } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es requerido'
                });
            }

            const response = await storeProductsService.getAllProductsUnfiltered({
                storeId,
                search,
                page,
                limit,
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener productos sin filtro:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener productos'
            });
        }
    };





    createSimpleProduct = async (req, res) => {
        try {
            const image = req.files?.image || null;
            const response = await storeProductsService.createSimpleProduct({
                ...req.body,
                image
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (err) {
            console.error('❌ Error al crear producto sin variantes:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    };


    createVariantProduct = async (req, res) => {
        try {
            const files = req.files;
            const body = {
                ...req.body,
                image: null, // no usamos `image` en variantes
            };

            const response = await storeProductsService.createVariantProduct(body, files);

            return res.status(response.success ? 200 : 400).json(response);
        } catch (err) {
            console.error('❌ Error al crear producto con variantes:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    };


    updateSimpleProduct = async (req, res) => {
        try {
            const { id } = req.params;
            const image = req.files?.image || null;
            const response = await storeProductsService.updateSimpleProduct(id, {
                ...req.body,
                image
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (err) {
            console.error('❌ Error al editar producto sin variantes:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    };


    updateVariantProduct = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await storeProductsService.updateVariantProduct(id, req.body, req.files);
            return res.status(200).json(response);
        } catch (err) {
            console.error('❌ Error al editar producto con variantes:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    };

    addCategoryToProduct = async (req, res) => {
        try {
            const { id } = req.params;
            const { categoryId } = req.body;

            if (!categoryId) {
                return res.status(400).json({
                    success: false,
                    message: 'categoryId es requerido'
                });
            }

            const response = await storeProductsService.addCategoryToProduct(id, categoryId);

            return res.status(response.success ? 200 : 400).json(response);
        } catch (err) {
            console.error('❌ Error al agregar categoría al producto:', err);
            return res.status(500).json({ success: false, message: 'Error inesperado' });
        }
    };

    addSubcategoryToProduct = async (req, res) => {
        try {
            const { id } = req.params;
            const { subcategoryId } = req.body;

            if (!subcategoryId) {
                return res.status(400).json({
                    success: false,
                    message: 'subcategoryId es requerido',
                });
            }

            const response = await storeProductsService.addSubcategoryToProduct(id, subcategoryId);

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al agregar subcategoría:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al agregar subcategoría',
            });
        }
    };






    deleteProduct = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await storeProductsService.deleteProduct(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al eliminar producto:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al eliminar producto',
            });
        }
    };
}
