import express from 'express';
import StoreAuthController from '../../controllers/store/storeAuthCotroller.js';

const router = express.Router();

const authController = new StoreAuthController();

// Endpoint para login
router.post('/login', authController.login);

// Endpoint para verificar estado del comercio por email
router.get('/login/:email', authController.checkCommerceStatus);

export default router;
