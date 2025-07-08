import express from 'express';
import StoreNotificationsController from '../../controllers/store/storeNotificationsController.js';

const router = express.Router();
const storeNotificationsController = new StoreNotificationsController();

router.get('/notifications', storeNotificationsController.getAllNotifications);
router.post('/notifications', storeNotificationsController.createNotification);
router.put('/notifications/:id', storeNotificationsController.updateNotification);
router.delete('/notifications/:id', storeNotificationsController.deleteNotification);

export default router;
