// routes/store/storeInfo.routes.js
import express from 'express';
import StoreInfoController from '../../controllers/store/storeInfoController.js';

const router = express.Router();
const storeInfoController = new StoreInfoController();

router.get('/info', storeInfoController.getStoreInfo);
router.put('/info', storeInfoController.updateStoreInfo);

export default router;
