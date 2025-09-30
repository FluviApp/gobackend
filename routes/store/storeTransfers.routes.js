// routes/store/storeOrdersByDeliveredMonthRoute.js
import express from 'express';
import StoreOrdersByDeliveredMonthController from '../../controllers/store/storeOrdersByDeliveredMonthController.js';

const router = express.Router();
const ctrl = new StoreOrdersByDeliveredMonthController();

// GET /api/store/ordersbymonth-delivered?storeId=... [&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD]
router.get('/ordersbymonth-delivered', ctrl.list);

export default router;
