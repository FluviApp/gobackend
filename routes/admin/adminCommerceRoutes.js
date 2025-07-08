import express from 'express';
import AdminCommerceController from '../../controllers/admin/adminCommerceController.js';

const router = express.Router();
const adminCommerceController = new AdminCommerceController();

router.post('/commerce/login', adminCommerceController.login);
router.get('/commerce/:id', adminCommerceController.getCommerceById);
router.get('/commerce', adminCommerceController.getAllCommerces);
router.post('/commerce', adminCommerceController.createCommerce);
router.put('/commerce/:id', adminCommerceController.updateCommerce);
router.delete('/commerce/:id', adminCommerceController.deleteCommerce);

export default router;
