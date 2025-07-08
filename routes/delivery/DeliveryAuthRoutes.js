import express from 'express';
import DeliveryAuthController from '../../controllers/delivery/DeliveryAuthController.js';

const router = express.Router();
const deliveryAuthController = new DeliveryAuthController();

router.post('/login', deliveryAuthController.login);
router.post('/register', deliveryAuthController.register);
router.post('/recover-password', deliveryAuthController.recoverPassword);
router.get('/me/:id', deliveryAuthController.getDeliveryById);
router.put('/me/:id', deliveryAuthController.updateDelivery);

export default router;
