import express from 'express';
import StoreSubcategoriesController from '../../controllers/store/storeSubcategoriesController.js';

const router = express.Router();
const storeSubcategoriesController = new StoreSubcategoriesController();

// GET - Obtener subcategorías de una categoría padre específica
router.get('/subcategories', storeSubcategoriesController.getSubcategories);

// POST - Crear una nueva subcategoría
router.post('/subcategories', storeSubcategoriesController.createSubcategory);

// PUT - Actualizar una subcategoría
router.put('/subcategories/:id', storeSubcategoriesController.updateSubcategory);

// DELETE - Eliminar una subcategoría
router.delete('/subcategories/:id', storeSubcategoriesController.deleteSubcategory);

export default router;
