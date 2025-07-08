import express from 'express';
import ClientSubcategoriesController from '../../controllers/client/ClientSubcategoriesController.js';

const router = express.Router();
const clientSubcategoriesController = new ClientSubcategoriesController();

router.get('/by-category/:categoryId', clientSubcategoriesController.getSubcategoriesByCategory);

export default router;
