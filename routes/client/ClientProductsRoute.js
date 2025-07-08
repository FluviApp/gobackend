// routes/client/products.route.js
import express from 'express';
import ClientProductsController from '../../controllers/client/ClientProductsController.js';

const router = express.Router();
const clientProductsController = new ClientProductsController();

router.get('/products/search', clientProductsController.searchStoreProducts);
router.get('/products/:id', clientProductsController.getProductById);
router.get('/products/by-category/:categoryId', clientProductsController.getProductsByCategory); // ✅ NUEVO
router.get('/products/by-subcategory/:subcategoryId', clientProductsController.getProductsBySubcategory);

export default router;
