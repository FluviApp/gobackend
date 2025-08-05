import express from 'express';
import PaymentController from '../../controllers/payment/PaymentController.js';

const router = express.Router();
const controller = new PaymentController();

router.post('/init', controller.createTransaction);
router.post('/commit', controller.commitTransaction);
router.get('/status/:token', controller.getTransactionStatus);
router.delete('/:token', controller.deleteTransaction);
router.get('/history', controller.getTransactionHistory); // opcional

export default router;
