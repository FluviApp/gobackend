import express from 'express';
import ClientAuthController from '../../controllers/client/ClientAuthController.js';

const router = express.Router();
const clientAuthController = new ClientAuthController();

// Ruta para login del cliente
router.post('/login', clientAuthController.login);
router.post('/register', clientAuthController.register);
router.post('/recover-password', clientAuthController.recoverPassword);
router.get('/me/:id', clientAuthController.getClientById);
router.get('/email/:email', clientAuthController.getClientByEmail);
router.put('/me/:id', clientAuthController.updateClient);

export default router;
