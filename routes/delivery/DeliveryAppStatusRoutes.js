import express from 'express';
import DeliveryAppStatusController from '../../controllers/delivery/DeliveryAppStatusController.js';

const router = express.Router();
const controller = new DeliveryAppStatusController();

router.get('/app-status', controller.getStatus);

export default router;
