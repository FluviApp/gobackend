import express from 'express';
import ClientPacksController from '../../controllers/client/ClientPacksController.js';

const router = express.Router();
const clientPacksController = new ClientPacksController();

// GET /api/client/packs?storeId=...
router.get('/', clientPacksController.getPacksByStore);

export default router;
