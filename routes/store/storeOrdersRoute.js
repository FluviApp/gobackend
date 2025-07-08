import express from 'express';
import StoreOrdersController from '../../controllers/store/storeOrdersController.js';

const router = express.Router();
const controller = new StoreOrdersController();

router.get('/orders', controller.getAllOrders);
router.post('/orders', controller.createOrder);
router.put('/orders/:id', controller.updateOrder);
router.delete('/orders/:id', controller.deleteOrder);

export default router;