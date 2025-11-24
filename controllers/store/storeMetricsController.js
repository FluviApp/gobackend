import StoreMetricsService from '../../services/store/storeMetrics.service.js';

const service = new StoreMetricsService();

export default class StoreMetricsController {
    // 🎯 Métricas principales del dashboard
    getDashboardMetrics = async (req, res) => {
        try {
            const { storeId } = req.params;
            const { period = '30d' } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es requerido'
                });
            }

            const response = await service.getDashboardMetrics(storeId, period);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Error en getDashboardMetrics controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener métricas del dashboard'
            });
        }
    };

    // 💰 Ventas por período
    getSalesByPeriod = async (req, res) => {
        try {
            const { storeId } = req.params;
            const { period = '30d' } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es requerido'
                });
            }

            const response = await service.getSalesByPeriod(storeId, period);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Error en getSalesByPeriod controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener ventas por período'
            });
        }
    };

    // 👥 Métricas de clientes
    getCustomerMetrics = async (req, res) => {
        try {
            const { storeId } = req.params;
            const { period = '30d' } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es requerido'
                });
            }

            const response = await service.getCustomerMetrics(storeId, period);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Error en getCustomerMetrics controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener métricas de clientes'
            });
        }
    };

    // 📦 Productos más vendidos
    getTopProducts = async (req, res) => {
        try {
            const { storeId } = req.params;
            const { period = '30d', limit = 20 } = req.query;

            // Obtener fechas usando el servicio
            const dateRange = service.getDateRange(period);

            const topProducts = await service.getTopProducts(storeId, dateRange.startDate, dateRange.endDate, parseInt(limit));

            return res.status(200).json({
                success: true,
                data: topProducts
            });
        } catch (error) {
            console.error('❌ Error en getTopProducts controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener productos más vendidos'
            });
        }
    };

    // 📈 Tendencias de ventas
    getSalesTrend = async (req, res) => {
        try {
            const { storeId } = req.params;
            const { period = '30d' } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es requerido'
                });
            }

            const response = await service.getSalesTrend(storeId, period);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Error en getSalesTrend controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener tendencias de ventas'
            });
        }
    };

    // 🏪 Tendencias de ventas en local
    getLocalSalesTrend = async (req, res) => {
        try {
            const { storeId } = req.params;
            const { period = '30d' } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es requerido'
                });
            }

            const response = await service.getLocalSalesTrend(storeId, period);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Error en getLocalSalesTrend controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener tendencias de ventas en local'
            });
        }
    };

    // 🕐 Métricas por hora
    getHourlyMetrics = async (req, res) => {
        try {
            const { storeId } = req.params;
            const { period = '7d' } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es requerido'
                });
            }

            const response = await service.getHourlyMetrics(storeId, period);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Error en getHourlyMetrics controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener métricas por hora'
            });
        }
    };

    // 📍 Métricas geográficas
    getGeographicMetrics = async (req, res) => {
        try {
            const { storeId } = req.params;
            const { period = '30d' } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es requerido'
                });
            }

            const response = await service.getGeographicMetrics(storeId, period);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Error en getGeographicMetrics controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener métricas geográficas'
            });
        }
    };

    // 📊 Métricas por método de pago
    getPaymentMethodMetrics = async (req, res) => {
        try {
            const { storeId } = req.params;
            const { period = '30d' } = req.query;

            // Obtener fechas usando el servicio
            const dateRange = service.getDateRange(period);

            const paymentMetrics = await service.getSalesByPaymentMethod(storeId, dateRange.startDate, dateRange.endDate);

            return res.status(200).json({
                success: true,
                data: paymentMetrics
            });
        } catch (error) {
            console.error('❌ Error en getPaymentMethodMetrics controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener métricas por método de pago'
            });
        }
    };

    // 📋 Reporte completo
    getFullReport = async (req, res) => {
        try {
            const { storeId } = req.params;
            const { period = '30d' } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'storeId es requerido'
                });
            }

            // Obtener todas las métricas en paralelo
            const [
                dashboardMetrics,
                salesByPeriod,
                customerMetrics,
                hourlyMetrics,
                geographicMetrics
            ] = await Promise.all([
                service.getDashboardMetrics(storeId, period),
                service.getSalesByPeriod(storeId, period),
                service.getCustomerMetrics(storeId, period),
                service.getHourlyMetrics(storeId, '7d'),
                service.getGeographicMetrics(storeId, period)
            ]);

            // Obtener métricas de pago por separado
            const dateRange = service.getDateRange(period);
            const paymentMetrics = await service.getSalesByPaymentMethod(storeId, dateRange.startDate, dateRange.endDate);

            const response = {
                success: true,
                data: {
                    dashboard: dashboardMetrics.data,
                    salesByPeriod: salesByPeriod.data,
                    customers: customerMetrics.data,
                    paymentMethods: paymentMetrics,
                    hourly: hourlyMetrics.data,
                    geographic: geographicMetrics.data,
                    generatedAt: new Date().toISOString(),
                    period: period
                }
            };

            return res.status(200).json(response);
        } catch (error) {
            console.error('❌ Error en getFullReport controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al generar reporte completo'
            });
        }
    };

    // 📊 Pedidos por día
    getOrdersByDay = async (req, res) => {
        try {
            const { storeId } = req.params;
            const { period = '30d' } = req.query;

            const result = await service.getOrdersByDay(storeId, period);

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Pedidos por día obtenidos correctamente',
                    data: result.data
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('❌ Error en getOrdersByDay controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // 📋 Pedidos por fecha específica
    getOrdersByDate = async (req, res) => {
        try {
            const { storeId, date } = req.params;

            const result = await service.getOrdersByDate(storeId, date);

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Pedidos por fecha obtenidos correctamente',
                    data: result.data
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('❌ Error en getOrdersByDate controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // 📊 Métricas generales del sistema (sin filtros de fecha)
    getGeneralMetrics = async (req, res) => {
        try {
            const { storeId } = req.params;

            const result = await service.getGeneralMetrics(storeId);

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Métricas generales obtenidas correctamente',
                    data: result.data
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('❌ Error en getGeneralMetrics controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };
}
