import express from 'express';
import StoreZonesController from '../../controllers/store/storeZonesController.js';

const router = express.Router();
const controller = new StoreZonesController();

router.get('/zones', controller.getAllZones);
router.post('/zones', controller.createZone);
router.put('/zones/:id', controller.updateZone);
router.delete('/zones/:id', controller.deleteZone);

export default router;
