// routes/store/storeOrdersByMonthRoute.js
import express from 'express';
import StoreOrdersByMonthController from '../../controllers/store/storeOrdersByMonthController.js';

const router = express.Router();
const ctrl = new StoreOrdersByMonthController();

// GET /api/store/ordersbymonth?storeId=...&startDate=...&endDate=...&dateField=createdAt|deliveryDate|deliveredAt
router.get('/ordersbymonth', ctrl.list);

export default router;
