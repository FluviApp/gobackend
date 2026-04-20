// src/routes/client/ClientDiscountCodesRoutes.js
import express from 'express';
import ClientDiscountCodesController from '../../controllers/client/ClientDiscountCodesController.js';

const router = express.Router();
const controller = new ClientDiscountCodesController();

router.post('/validate', controller.validateDiscountCode);

export default router;
