// routes/store/storeInfo.routes.js
import express from 'express';
import StoreInfoController from '../../controllers/store/storeInfoController.js';

const router = express.Router();
const storeInfoController = new StoreInfoController();

router.get('/info', storeInfoController.getStoreInfo);

console.log('[router] /api/store/info ready'); // <- te confirma que el archivo se cargó

export default router;
