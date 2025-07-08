import express from 'express';
import StoreCategoriesController from '../../controllers/store/storeCategoriesController.js';

const router = express.Router();
const storeCategoriesController = new StoreCategoriesController();

// GET - Obtener todas las categorías paginadas por storeId
router.get('/categories', storeCategoriesController.getAllCategories);

// POST - Crear una nueva categoría
router.post('/categories', storeCategoriesController.createCategory);

// PUT - Actualizar una categoría
router.put('/categories/:id', storeCategoriesController.updateCategory);

// DELETE - Eliminar una categoría
router.delete('/categories/:id', storeCategoriesController.deleteCategory);

export default router;
