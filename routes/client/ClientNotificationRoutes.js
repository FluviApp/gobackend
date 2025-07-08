import express from 'express';
import ClientNotificationController from '../../controllers/client/ClientNotificationController.js';

const router = express.Router();
const clientNotificationController = new ClientNotificationController();

router.get('/by-email', clientNotificationController.getNotificationsByEmail);

export default router;
