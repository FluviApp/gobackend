import express from 'express';
import StoreTransfersController from '../../controllers/store/storeTransfersController.js';

const router = express.Router();
const storeTransfersController = new StoreTransfersController();

// GET /api/store/transfersmonth?storeId=...&startDate=...&endDate=...&paymentMethod=transferencia
router.get('/transfersmonth', storeTransfersController.getTransfersMonth);

export default router;
