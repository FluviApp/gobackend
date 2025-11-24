import express from 'express';
import StoreMetricsController from '../../controllers/store/storeMetricsController.js';

const router = express.Router();
const controller = new StoreMetricsController();

// 🎯 Dashboard principal
router.get('/dashboard/:storeId', controller.getDashboardMetrics);

// 💰 Ventas por período
router.get('/sales/:storeId', controller.getSalesByPeriod);

// 👥 Métricas de clientes
router.get('/customers/:storeId', controller.getCustomerMetrics);

// 📦 Productos más vendidos
router.get('/products/:storeId', controller.getTopProducts);

// 📈 Tendencias de ventas
router.get('/trends/:storeId', controller.getSalesTrend);
router.get('/local-sales/:storeId', controller.getLocalSalesTrend);

// 🕐 Métricas por hora
router.get('/hourly/:storeId', controller.getHourlyMetrics);

// 📍 Métricas geográficas
router.get('/geographic/:storeId', controller.getGeographicMetrics);

// 📊 Métricas por método de pago
router.get('/payment-methods/:storeId', controller.getPaymentMethodMetrics);

// 📊 Pedidos por día
router.get('/orders-by-day/:storeId', controller.getOrdersByDay);

// 📋 Pedidos por fecha específica
router.get('/orders-by-date/:storeId/:date', controller.getOrdersByDate);

// 📊 Métricas generales del sistema (sin filtros de fecha)
router.get('/general/:storeId', controller.getGeneralMetrics);

// 📋 Reporte completo
router.get('/full-report/:storeId', controller.getFullReport);

export default router;
