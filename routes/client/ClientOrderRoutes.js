import express from 'express';
import ClientOrderController from '../../controllers/client/ClientOrderController.js';

const router = express.Router();
const clientOrderController = new ClientOrderController();

router.post('/create', clientOrderController.createOrder);
router.get('/pending', clientOrderController.getPendingOrders);
router.get('/by-client/:clientId', clientOrderController.getOrdersByClientId);

export default router;
