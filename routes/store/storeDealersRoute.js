import express from 'express';
import StoreDealersController from '../../controllers/store/storeDealersController.js';

const router = express.Router();
const controller = new StoreDealersController();

router.get('/dealers', controller.getAllDealers);
router.get('/dealers/all', controller.getDealersByStoreId)
router.post('/dealers', controller.createDealer);
router.put('/dealers/:id', controller.updateDealer);
router.delete('/dealers/:id', controller.deleteDealer);

export default router;