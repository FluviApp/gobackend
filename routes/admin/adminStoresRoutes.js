import express from 'express';
import AdminStoresController from '../../controllers/admin/adminStoresController.js';

const router = express.Router();
const adminStoresController = new AdminStoresController();

router.get('/stores', adminStoresController.getAllStores);
router.post('/stores', adminStoresController.createStore);
router.put('/stores/:id', adminStoresController.updateStore);
router.delete('/stores/:id', adminStoresController.deleteStore);

export default router;
