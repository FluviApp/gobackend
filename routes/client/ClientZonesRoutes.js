import express from 'express';
import ClientZonesController from '../../controllers/client/ClientZonesController.js';

const router = express.Router();
const clientZonesController = new ClientZonesController();

router.post('/zones/resolve-location', clientZonesController.resolveLocation);

export default router;
