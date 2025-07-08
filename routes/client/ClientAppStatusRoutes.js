import express from 'express';
import ClientAppStatusController from '../../controllers/client/ClientAppStatusController.js';

const router = express.Router();
const clientAppStatusController = new ClientAppStatusController();

router.get('/status', clientAppStatusController.getAppStatus);
router.get('/store-data/:storeId', clientAppStatusController.getStoreData);

export default router;
