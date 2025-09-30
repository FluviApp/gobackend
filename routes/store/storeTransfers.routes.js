import express from 'express';
import StoreTransfersController from '../../controllers/store/storeTransfersController.js';

const router = express.Router();
const storeTransfersController = new StoreTransfersController();

// EXISTENTE: /api/store/transfersmonth
router.get('/transfersmonth', storeTransfersController.getTransfersMonth);

// NUEVO: /api/store/ordersbymonth-delivered  (usa deliveredAt)
router.get('/ordersbymonth-delivered', storeTransfersController.listByDeliveredMonth);

export default router;
