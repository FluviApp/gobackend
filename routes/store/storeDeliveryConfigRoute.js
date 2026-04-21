import express from 'express';
import StoreDeliveryConfigController from '../../controllers/store/storeDeliveryConfigController.js';

const router = express.Router();
const storeDeliveryConfigController = new StoreDeliveryConfigController();

router.get('/delivery-config', storeDeliveryConfigController.getDeliveryConfig);
router.put('/delivery-config', storeDeliveryConfigController.updateDeliveryConfig);

export default router;
