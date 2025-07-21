import express from 'express';
import StoreProductsController from '../../controllers/store/storeProductsController.js';

const router = express.Router();
const storeProductsController = new StoreProductsController();

router.get('/products', storeProductsController.getAllProducts);
router.get('/products/all', storeProductsController.getAllProductsUnfiltered);
router.get('/products/select', storeProductsController.getAllProductsForSelect);

router.delete('/products/:id', storeProductsController.deleteProduct);
router.put('/products/:id/add-category', storeProductsController.addCategoryToProduct);
router.put('/products/:id/add-subcategory', storeProductsController.addSubcategoryToProduct);

router.post('/products/simple', storeProductsController.createSimpleProduct);
router.post('/products/variant', storeProductsController.createVariantProduct);
router.put('/products/simple/:id', storeProductsController.updateSimpleProduct);
router.put('/products/variant/:id', storeProductsController.updateVariantProduct);

export default router;
