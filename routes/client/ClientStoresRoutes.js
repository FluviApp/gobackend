import express from 'express';
import ClientStoresController from '../../controllers/client/ClientStoresController.js';

const router = express.Router();
const clientStoresController = new ClientStoresController();

// Resolver de código de tienda → { storeId, name, logo }
router.get('/store-by-code/:code', clientStoresController.getStoreByCode);

export default router;
