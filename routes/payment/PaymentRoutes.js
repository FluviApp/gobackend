import express from 'express';
import PaymentController from '../../controllers/payment/PaymentController.js';

const router = express.Router();
const controller = new PaymentController();

router.post('/init', controller.createTransaction);
router.post('/commit', controller.commitTransaction);
router.get('/status/:token', controller.getTransactionStatus);
router.get('/info/:token', controller.getTransactionInfo); // Información completa de transacción
router.get('/order/:token', controller.getOrderByTransactionToken); // Buscar pedido por token
router.get('/pending/:sessionId', controller.getPendingTransactions); // Transacciones pendientes
router.delete('/:token', controller.deleteTransaction);
router.get('/history', controller.getTransactionHistory); // opcional
router.get('/webpay-result', controller.webpayResult); // Endpoint que reemplaza el HTML estático
router.get('/webpay-redirect', controller.webpayRedirect); // Endpoint para redirigir a Webpay con POST (genera HTML dinámicamente)

export default router;
