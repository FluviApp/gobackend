import express from 'express';
import MercadoPagoController from '../../controllers/payment/MercadoPagoController.js';

const router = express.Router();
const controller = new MercadoPagoController();

// Rutas de Mercado Pago - completamente separadas de Webpay
router.post('/init', controller.createPreference); // Crear preferencia de pago
router.get('/status/:token', controller.getPaymentStatus); // Consultar estado de pago
router.get('/info/:token', controller.getTransactionInfo); // Información completa de transacción
router.get('/order/:token', controller.getOrderByTransactionToken); // Buscar pedido por token
router.get('/pending/:sessionId', controller.getPendingTransactions); // Transacciones pendientes
router.post('/webhook', express.urlencoded({ extended: true }), controller.processWebhook); // Webhook de Mercado Pago
router.get('/result', controller.handleResult); // Resultado de redirección de Mercado Pago
router.post('/link-order', controller.linkOrder); // Vincular pedido con transacción
router.post('/cancel', controller.cancel); // Cancelar transacción por usuario

export default router;

