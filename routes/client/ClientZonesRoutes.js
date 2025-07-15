import express from 'express';
import ClientZonesController from '../../controllers/client/ClientZonesController.js';

const router = express.Router();
const clientZonesController = new ClientZonesController();

router.post('/zones/resolve-location', clientZonesController.resolveLocation);
router.post('/zones/validate-store-location', clientZonesController.validateStoreLocation);

export default router;
