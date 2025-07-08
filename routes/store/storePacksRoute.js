import express from 'express';
import StorePacksController from '../../controllers/store/storePacksController.js';

const router = express.Router();
const storePacksController = new StorePacksController();

router.get('/packs', storePacksController.getAllPacks);
router.post('/packs', storePacksController.createPack);
router.put('/packs/:id', storePacksController.updatePack);
router.delete('/packs/:id', storePacksController.deletePack);

export default router;
