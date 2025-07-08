// src/routes/store/storeDiscountCodesRoute.js
import express from 'express';
import StoreDiscountCodesController from '../../controllers/store/StoreDiscountCodesController.js';

const router = express.Router();
const discountCodesController = new StoreDiscountCodesController();

// GET /discount-codes?storeId=...&page=1&limit=10
router.get('/discount-codes', discountCodesController.getAllDiscountCodes);

// POST /discount-codes
router.post('/discount-codes', discountCodesController.createDiscountCode);

// PUT /discount-codes/:id
router.put('/discount-codes/:id', discountCodesController.updateDiscountCode);

// DELETE /discount-codes/:id
router.delete('/discount-codes/:id', discountCodesController.deleteDiscountCode);

export default router;
