import express from 'express';
import StoreClientsController from '../../controllers/store/storeClientsController.js';

const router = express.Router();
const storeClientsController = new StoreClientsController();


router.get('/clients', storeClientsController.getAllClients);
router.post('/clients', storeClientsController.createClient);
router.put('/clients/:id', storeClientsController.updateClient);
router.delete('/clients/:id', storeClientsController.deleteClient);

export default router;
