import connectMongoDB from '../../libs/mongoose.js';
import Orders from '../../models/Orders.js';
import Clients from '../../models/Clients.js';
import Product from '../../models/Product.js';

// ⏰ Zona horaria Chile con dayjs
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

const TZ = 'America/Santiago';
dayjs.tz.setDefault(TZ);

class StoreMetricsService {
    constructor() {
        connectMongoDB();
    }

    // 🎯 Métricas filtradas del dashboard (cambian según período)
    getDashboardMetrics = async (storeId, period = '30d') => {
        try {
            const { startDate, endDate } = this.getDateRange(period);

            // Métricas principales filtradas
            const [
                totalSales,
                totalOrders,
                totalCustomers,
                avgOrderValue,
                salesByPaymentMethod,
                salesTrend,
                hourlyMetrics
            ] = await Promise.all([
                this.getTotalSales(storeId, startDate, endDate),
                this.getTotalOrders(storeId, startDate, endDate),
                this.getTotalCustomers(storeId, startDate, endDate),
                this.getAverageOrderValue(storeId, startDate, endDate),
                this.getSalesByPaymentMethod(storeId, startDate, endDate),
                this.getSalesTrend(storeId, period),
                this.getHourlyMetrics(storeId, period)
            ]);

            // Cálculo de crecimiento vs período anterior
            const previousPeriod = this.getPreviousPeriod(period);
            const previousSales = await this.getTotalSales(storeId, previousPeriod.startDate, previousPeriod.endDate);
            const growthPercentage = previousSales.total > 0
                ? ((totalSales.total - previousSales.total) / previousSales.total) * 100
                : 0;

            return {
                success: true,
                data: {
                    summary: {
                        totalSales: totalSales.total,
                        totalOrders: totalOrders.total,
                        totalCustomers: totalCustomers.total,
                        avgOrderValue: avgOrderValue.average,
                        growthPercentage: Math.round(growthPercentage * 100) / 100
                    },
                    salesByPaymentMethod,
                    salesTrend,
                    hourlyMetrics
                }
            };
        } catch (error) {
            console.error('❌ Error en getDashboardMetrics:', error);
            return {
                success: false,
                message: 'Error al obtener métricas del dashboard'
            };
        }
    };

    // 📊 Métricas generales del sistema (sin filtros de fecha)
    getGeneralMetrics = async (storeId) => {
        try {
            const [
                topProducts,
                customerMetrics,
                ordersByStatus
            ] = await Promise.all([
                this.getTopProductsGeneral(storeId),
                this.getCustomerMetricsGeneral(storeId),
                this.getOrdersByStatusGeneral(storeId)
            ]);

            return {
                success: true,
                data: {
                    topProducts,
                    customerMetrics,
                    ordersByStatus
                }
            };
        } catch (error) {
            console.error('❌ Error en getGeneralMetrics:', error);
            return {
                success: false,
                message: 'Error al obtener métricas generales'
            };
        }
    };

    // 💰 Ventas por período
    getSalesByPeriod = async (storeId, period = '30d') => {
        try {
            const { startDate, endDate, groupBy } = this.getDateRangeWithGrouping(period);

            const salesData = await Orders.aggregate([
                {
                    $match: {
                        storeId: storeId,
                        status: { $nin: ['cancelado', 'devuelto'] },
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: groupBy,
                        totalSales: { $sum: '$finalPrice' },
                        orderCount: { $sum: 1 },
                        avgOrderValue: { $avg: '$finalPrice' }
                    }
                },
                {
                    $sort: { '_id': 1 }
                },
                {
                    $project: {
                        _id: 0,
                        period: '$_id',
                        totalSales: 1,
                        orderCount: 1,
                        avgOrderValue: { $round: ['$avgOrderValue', 0] }
                    }
                }
            ]);

            return {
                success: true,
                data: salesData
            };
        } catch (error) {
            console.error('❌ Error en getSalesByPeriod:', error);
            return {
                success: false,
                message: 'Error al obtener ventas por período'
            };
        }
    };

    // 💳 Ventas por método de pago
    getSalesByPaymentMethod = async (storeId, startDate, endDate) => {
        try {
            const paymentMethodData = await Orders.aggregate([
                {
                    $match: {
                        storeId: storeId,
                        status: 'entregado', // Solo pedidos entregados
                        deliveredAt: { $gte: startDate, $lte: endDate } // Filtro por fecha de entrega
                    }
                },
                {
                    $group: {
                        _id: '$paymentMethod',
                        totalSales: { $sum: '$finalPrice' },
                        orderCount: { $sum: 1 },
                        percentage: { $avg: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        paymentMethod: '$_id',
                        totalSales: 1,
                        orderCount: 1,
                        percentage: 1
                    }
                }
            ]);

            // Calcular porcentajes
            const totalSales = paymentMethodData.reduce((sum, item) => sum + item.totalSales, 0);
            const dataWithPercentages = paymentMethodData.map(item => ({
                ...item,
                percentage: totalSales > 0 ? Math.round((item.totalSales / totalSales) * 100 * 100) / 100 : 0
            }));

            return dataWithPercentages;
        } catch (error) {
            console.error('❌ Error en getSalesByPaymentMethod:', error);
            return [];
        }
    };

    // 👥 Métricas de clientes
    getCustomerMetrics = async (storeId, period = '30d') => {
        try {
            const { startDate, endDate } = this.getDateRange(period);

            const customerMetrics = await Orders.aggregate([
                {
                    $match: {
                        storeId: storeId,
                        status: { $nin: ['cancelado', 'devuelto'] },
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: '$customer.id',
                        customerName: { $first: '$customer.name' },
                        customerAddress: { $first: '$customer.address' },
                        totalSpent: { $sum: '$finalPrice' },
                        orderCount: { $sum: 1 },
                        avgOrderValue: { $avg: '$finalPrice' },
                        firstOrderDate: { $min: '$createdAt' },
                        lastOrderDate: { $max: '$createdAt' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        customerId: '$_id',
                        customerName: 1,
                        customerAddress: 1,
                        totalSpent: 1,
                        orderCount: 1,
                        avgOrderValue: { $round: ['$avgOrderValue', 0] },
                        firstOrderDate: 1,
                        lastOrderDate: 1
                    }
                },
                {
                    $sort: { totalSpent: -1 }
                }
            ]);

            // Calcular métricas adicionales
            const totalCustomers = customerMetrics.length;
            const totalRevenue = customerMetrics.reduce((sum, customer) => sum + customer.totalSpent, 0);
            const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

            // Clientes nuevos vs recurrentes en el período seleccionado
            // Cliente nuevo = primera compra en el período
            // Cliente recurrente = ya había comprado antes del período
            const { startDate: periodStartDate } = this.getDateRange(period);

            // Obtener todos los clientes que compraron antes del período
            const customersBeforePeriod = await Orders.distinct('customer.id', {
                storeId: storeId,
                status: { $nin: ['cancelado', 'devuelto'] },
                createdAt: { $lt: periodStartDate }
            });

            const newCustomers = customerMetrics.filter(c => !customersBeforePeriod.includes(c.customerId)).length;
            const recurringCustomers = totalCustomers - newCustomers;

            // Obtener clientes nuevos del mes actual (que hicieron su primera compra este mes)
            const currentMonthStart = dayjs().startOf('month').toDate();
            const currentMonthEnd = dayjs().endOf('month').toDate();

            const newCustomersThisMonth = await Orders.aggregate([
                {
                    $match: {
                        storeId: storeId,
                        status: { $nin: ['cancelado', 'devuelto'] }
                    }
                },
                {
                    $group: {
                        _id: '$customer.id',
                        customerName: { $first: '$customer.name' },
                        customerAddress: { $first: '$customer.address' },
                        totalSpent: { $sum: '$finalPrice' },
                        orderCount: { $sum: 1 },
                        firstOrderDate: { $min: '$createdAt' },
                        lastOrderDate: { $max: '$createdAt' }
                    }
                },
                {
                    $match: {
                        // Solo clientes cuya primera compra fue en este mes
                        firstOrderDate: { $gte: currentMonthStart, $lte: currentMonthEnd }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        customerId: '$_id',
                        customerName: 1,
                        customerAddress: 1,
                        totalSpent: 1,
                        orderCount: 1,
                        firstOrderDate: 1,
                        lastOrderDate: 1
                    }
                },
                {
                    $sort: { firstOrderDate: -1 }
                }
            ]);

            return {
                success: true,
                data: {
                    summary: {
                        totalCustomers,
                        newCustomers,
                        recurringCustomers,
                        avgCustomerValue: Math.round(avgCustomerValue),
                        totalRevenue
                    },
                    topCustomers: customerMetrics.slice(0, 20),
                    newCustomers: newCustomersThisMonth,
                    customerDistribution: {
                        new: newCustomers,
                        recurring: recurringCustomers
                    }
                }
            };
        } catch (error) {
            console.error('❌ Error en getCustomerMetrics:', error);
            return {
                success: false,
                message: 'Error al obtener métricas de clientes'
            };
        }
    };

    // 📦 Productos más vendidos
    getTopProducts = async (storeId, startDate, endDate, limit = 20) => {
        try {
            const topProducts = await Orders.aggregate([
                {
                    $match: {
                        storeId: storeId,
                        status: { $nin: ['cancelado', 'devuelto'] },
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                { $unwind: '$products' },
                {
                    $group: {
                        _id: {
                            productId: '$products.productId',
                            productName: '$products.name'
                        },
                        totalQuantity: { $sum: '$products.quantity' },
                        totalRevenue: { $sum: '$products.totalPrice' },
                        orderCount: { $sum: 1 },
                        avgPrice: { $avg: '$products.unitPrice' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        productId: '$_id.productId',
                        productName: '$_id.productName',
                        totalQuantity: 1,
                        totalRevenue: 1,
                        orderCount: 1,
                        avgPrice: { $round: ['$avgPrice', 0] }
                    }
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: limit }
            ]);

            return topProducts;
        } catch (error) {
            console.error('❌ Error en getTopProducts:', error);
            return [];
        }
    };

    // 📈 Tendencias de ventas
    getSalesTrend = async (storeId, period = '30d') => {
        try {
            const { startDate, endDate, groupBy } = this.getDateRangeWithGrouping(period);

            const trendData = await Orders.aggregate([
                {
                    $match: {
                        storeId: storeId,
                        status: 'entregado', // Solo pedidos entregados
                        deliveredAt: { $gte: startDate, $lte: endDate } // Filtro por fecha de entrega
                    }
                },
                {
                    $group: {
                        _id: groupBy,
                        totalSales: { $sum: '$finalPrice' },
                        orderCount: { $sum: 1 },
                        uniqueCustomers: { $addToSet: '$customer.id' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        period: '$_id',
                        totalSales: 1,
                        orderCount: 1,
                        uniqueCustomers: { $size: '$uniqueCustomers' }
                    }
                },
                { $sort: { period: 1 } }
            ]);

            return {
                success: true,
                data: trendData
            };
        } catch (error) {
            console.error('❌ Error en getSalesTrend:', error);
            return {
                success: false,
                message: 'Error al obtener tendencias de ventas'
            };
        }
    };

    // 🕐 Métricas por hora del día
    getHourlyMetrics = async (storeId, period = '7d') => {
        try {
            const { startDate, endDate } = this.getDateRange(period);

            const hourlyData = await Orders.aggregate([
                {
                    $match: {
                        storeId: storeId,
                        status: 'entregado', // Solo pedidos entregados
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: { $hour: { $dateFromString: { dateString: { $toString: '$createdAt' } } } },
                        totalSales: { $sum: '$finalPrice' },
                        orderCount: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        hour: '$_id',
                        totalSales: 1,
                        orderCount: 1
                    }
                },
                { $sort: { hour: 1 } }
            ]);

            return {
                success: true,
                data: hourlyData
            };
        } catch (error) {
            console.error('❌ Error en getHourlyMetrics:', error);
            return {
                success: false,
                message: 'Error al obtener métricas por hora'
            };
        }
    };

    // 📍 Métricas geográficas
    getGeographicMetrics = async (storeId, period = '30d') => {
        try {
            const { startDate, endDate } = this.getDateRange(period);

            const geographicData = await Orders.aggregate([
                {
                    $match: {
                        storeId: storeId,
                        status: { $nin: ['cancelado', 'devuelto'] },
                        createdAt: { $gte: startDate, $lte: endDate },
                        'customer.lat': { $exists: true, $ne: null },
                        'customer.lon': { $exists: true, $ne: null }
                    }
                },
                {
                    $group: {
                        _id: {
                            lat: { $round: [{ $multiply: ['$customer.lat', 100] }, 0] },
                            lon: { $round: [{ $multiply: ['$customer.lon', 100] }, 0] }
                        },
                        totalSales: { $sum: '$finalPrice' },
                        orderCount: { $sum: 1 },
                        addresses: { $addToSet: '$customer.address' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        lat: { $divide: ['$_id.lat', 100] },
                        lon: { $divide: ['$_id.lon', 100] },
                        totalSales: 1,
                        orderCount: 1,
                        address: { $arrayElemAt: ['$addresses', 0] }
                    }
                },
                { $sort: { totalSales: -1 } }
            ]);

            return {
                success: true,
                data: geographicData
            };
        } catch (error) {
            console.error('❌ Error en getGeographicMetrics:', error);
            return {
                success: false,
                message: 'Error al obtener métricas geográficas'
            };
        }
    };

    // 🔧 Métodos auxiliares
    getDateRange = (period) => {
        const now = dayjs().tz(TZ);
        let startDate, endDate;

        switch (period) {
            case '7d':
                startDate = now.subtract(7, 'day').startOf('day').toDate();
                endDate = now.endOf('day').toDate();
                break;
            case '30d':
                startDate = now.subtract(30, 'day').startOf('day').toDate();
                endDate = now.endOf('day').toDate();
                break;
            case '90d':
                startDate = now.subtract(90, 'day').startOf('day').toDate();
                endDate = now.endOf('day').toDate();
                break;
            case '1y':
                startDate = now.subtract(1, 'year').startOf('day').toDate();
                endDate = now.endOf('day').toDate();
                break;
            case 'current_month':
                startDate = now.startOf('month').toDate();
                endDate = now.endOf('day').toDate();
                break;
            case 'today':
                startDate = now.startOf('day').toDate();
                endDate = now.endOf('day').toDate();
                break;
            default:
                startDate = now.subtract(30, 'day').startOf('day').toDate();
                endDate = now.endOf('day').toDate();
        }

        return { startDate, endDate };
    };

    getDateRangeWithGrouping = (period) => {
        const { startDate, endDate } = this.getDateRange(period);
        let groupBy;

        switch (period) {
            case '7d':
                groupBy = {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$deliveredAt',
                        timezone: TZ
                    }
                };
                break;
            case '30d':
            case 'today':
                groupBy = {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$deliveredAt',
                        timezone: TZ
                    }
                };
                break;
            case '90d':
                groupBy = {
                    $dateToString: {
                        format: '%Y-%W',
                        date: '$deliveredAt',
                        timezone: TZ
                    }
                };
                break;
            case '1y':
                groupBy = {
                    $dateToString: {
                        format: '%Y-%m',
                        date: '$deliveredAt',
                        timezone: TZ
                    }
                };
                break;
            case 'current_month':
                groupBy = {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$deliveredAt',
                        timezone: TZ
                    }
                };
                break;
            default:
                groupBy = {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$deliveredAt',
                        timezone: TZ
                    }
                };
        }

        return { startDate, endDate, groupBy };
    };

    getPreviousPeriod = (period) => {
        const now = dayjs().tz(TZ);
        let startDate, endDate;

        switch (period) {
            case '7d':
                startDate = now.subtract(14, 'day').startOf('day').toDate();
                endDate = now.subtract(8, 'day').endOf('day').toDate();
                break;
            case '30d':
                startDate = now.subtract(60, 'day').startOf('day').toDate();
                endDate = now.subtract(31, 'day').endOf('day').toDate();
                break;
            case '90d':
                startDate = now.subtract(180, 'day').startOf('day').toDate();
                endDate = now.subtract(91, 'day').endOf('day').toDate();
                break;
            case '1y':
                startDate = now.subtract(2, 'year').startOf('day').toDate();
                endDate = now.subtract(1, 'year').endOf('day').toDate();
                break;
            case 'current_month':
                // Período anterior sería el mes anterior completo
                startDate = now.subtract(1, 'month').startOf('month').toDate();
                endDate = now.subtract(1, 'month').endOf('month').toDate();
                break;
            case 'today':
                // Período anterior sería el día anterior
                startDate = now.subtract(1, 'day').startOf('day').toDate();
                endDate = now.subtract(1, 'day').endOf('day').toDate();
                break;
            default:
                startDate = now.subtract(60, 'day').startOf('day').toDate();
                endDate = now.subtract(31, 'day').endOf('day').toDate();
        }

        return { startDate, endDate };
    };

    // Métodos individuales para métricas específicas
    getTotalSales = async (storeId, startDate, endDate) => {
        const result = await Orders.aggregate([
            {
                $match: {
                    storeId: storeId,
                    status: 'entregado', // Solo pedidos entregados
                    deliveredAt: { $gte: startDate, $lte: endDate } // Filtro por fecha de entrega
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$finalPrice' }
                }
            }
        ]);
        return result[0] || { total: 0 };
    };

    getTotalOrders = async (storeId, startDate, endDate) => {
        const result = await Orders.aggregate([
            {
                $match: {
                    storeId: storeId,
                    status: 'entregado', // Solo pedidos entregados
                    deliveredAt: { $gte: startDate, $lte: endDate } // Filtro por fecha de entrega
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 }
                }
            }
        ]);
        return result[0] || { total: 0 };
    };

    getTotalCustomers = async (storeId, startDate, endDate) => {
        const result = await Orders.aggregate([
            {
                $match: {
                    storeId: storeId,
                    status: 'entregado', // Solo pedidos entregados
                    deliveredAt: { $gte: startDate, $lte: endDate } // Filtro por fecha de entrega
                }
            },
            {
                $group: {
                    _id: '$customer.id'
                }
            },
            {
                $count: 'total'
            }
        ]);
        return result[0] || { total: 0 };
    };

    getAverageOrderValue = async (storeId, startDate, endDate) => {
        const result = await Orders.aggregate([
            {
                $match: {
                    storeId: storeId,
                    status: 'entregado', // Solo pedidos entregados
                    deliveredAt: { $gte: startDate, $lte: endDate } // Filtro por fecha de entrega
                }
            },
            {
                $group: {
                    _id: null,
                    average: { $avg: '$finalPrice' }
                }
            }
        ]);
        return result[0] || { average: 0 };
    };

    getOrdersByStatus = async (storeId, startDate, endDate) => {
        return await Orders.aggregate([
            {
                $match: {
                    storeId: storeId,
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$finalPrice' }
                }
            },
            {
                $project: {
                    _id: 0,
                    status: '$_id',
                    count: 1,
                    totalValue: 1
                }
            }
        ]);
    };

    // 📊 Pedidos por día
    getOrdersByDay = async (storeId, period = '30d') => {
        try {
            const { startDate, endDate, groupBy } = this.getDateRangeWithGrouping(period);

            const ordersByDay = await Orders.aggregate([
                {
                    $match: {
                        storeId: storeId,
                        status: 'entregado', // Solo pedidos entregados
                        deliveredAt: { $gte: startDate, $lte: endDate } // Filtro por fecha de entrega
                    }
                },
                {
                    $group: {
                        _id: groupBy,
                        orderCount: { $sum: 1 },
                        totalSales: { $sum: '$finalPrice' },
                        avgOrderValue: { $avg: '$finalPrice' },
                        uniqueCustomers: { $addToSet: '$customer.id' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        date: '$_id',
                        orderCount: 1,
                        totalSales: 1,
                        avgOrderValue: { $round: ['$avgOrderValue', 0] },
                        uniqueCustomers: { $size: '$uniqueCustomers' }
                    }
                },
                { $sort: { date: 1 } }
            ]);

            return {
                success: true,
                data: ordersByDay
            };
        } catch (error) {
            console.error('❌ Error en getOrdersByDay:', error);
            return {
                success: false,
                message: 'Error al obtener pedidos por día'
            };
        }
    };

    // 📋 Pedidos detallados por fecha
    getOrdersByDate = async (storeId, date) => {
        try {
            const startOfDay = dayjs(date).startOf('day').toDate();
            const endOfDay = dayjs(date).endOf('day').toDate();

            const orders = await Orders.find({
                storeId: storeId,
                status: { $nin: ['cancelado', 'devuelto'] },
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            })
                .sort({ createdAt: -1 })
                .limit(100); // Limitar a 100 pedidos para evitar sobrecarga

            return {
                success: true,
                data: orders
            };
        } catch (error) {
            console.error('❌ Error en getOrdersByDate:', error);
            return {
                success: false,
                message: 'Error al obtener pedidos por fecha'
            };
        }
    };

    // 📊 MÉTODOS PARA MÉTRICAS GENERALES (sin filtros de fecha)

    // 📦 Productos más vendidos generales (todos los tiempos)
    getTopProductsGeneral = async (storeId) => {
        try {
            const topProducts = await Orders.aggregate([
                {
                    $match: {
                        storeId: storeId,
                        status: 'entregado'
                    }
                },
                { $unwind: '$products' },
                {
                    $group: {
                        _id: {
                            productId: '$products.productId',
                            productName: '$products.name'
                        },
                        totalQuantity: { $sum: '$products.quantity' },
                        totalRevenue: { $sum: '$products.totalPrice' },
                        orderCount: { $sum: 1 },
                        avgPrice: { $avg: '$products.unitPrice' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        productId: '$_id.productId',
                        productName: '$_id.productName',
                        totalQuantity: 1,
                        totalRevenue: 1,
                        orderCount: 1,
                        avgPrice: { $round: ['$avgPrice', 0] }
                    }
                },
                { $sort: { totalRevenue: -1 } },
                { $limit: 10 }
            ]);

            return topProducts;
        } catch (error) {
            console.error('❌ Error en getTopProductsGeneral:', error);
            return [];
        }
    };

    // 👥 Métricas de clientes generales (todos los tiempos)
    getCustomerMetricsGeneral = async (storeId) => {
        try {
            // Mejores clientes históricos
            const customerMetrics = await Orders.aggregate([
                {
                    $match: {
                        storeId: storeId,
                        status: 'entregado'
                    }
                },
                {
                    $group: {
                        _id: '$customer.id',
                        customerName: { $first: '$customer.name' },
                        customerAddress: { $first: '$customer.address' },
                        totalSpent: { $sum: '$finalPrice' },
                        orderCount: { $sum: 1 },
                        avgOrderValue: { $avg: '$finalPrice' },
                        firstOrderDate: { $min: '$createdAt' },
                        lastOrderDate: { $max: '$createdAt' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        customerId: '$_id',
                        customerName: 1,
                        customerAddress: 1,
                        totalSpent: 1,
                        orderCount: 1,
                        avgOrderValue: { $round: ['$avgOrderValue', 0] },
                        firstOrderDate: 1,
                        lastOrderDate: 1
                    }
                },
                { $sort: { totalSpent: -1 } },
                { $limit: 20 }
            ]);

            // Clientes nuevos del mes actual
            const currentMonthStart = dayjs().startOf('month').toDate();
            const currentMonthEnd = dayjs().endOf('month').toDate();

            const newCustomersThisMonth = await Orders.aggregate([
                {
                    $match: {
                        storeId: storeId,
                        status: 'entregado'
                    }
                },
                {
                    $group: {
                        _id: '$customer.id',
                        customerName: { $first: '$customer.name' },
                        customerAddress: { $first: '$customer.address' },
                        totalSpent: { $sum: '$finalPrice' },
                        orderCount: { $sum: 1 },
                        firstOrderDate: { $min: '$createdAt' },
                        lastOrderDate: { $max: '$createdAt' }
                    }
                },
                {
                    $match: {
                        firstOrderDate: { $gte: currentMonthStart, $lte: currentMonthEnd }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        customerId: '$_id',
                        customerName: 1,
                        customerAddress: 1,
                        totalSpent: 1,
                        orderCount: 1,
                        firstOrderDate: 1,
                        lastOrderDate: 1
                    }
                },
                { $sort: { firstOrderDate: -1 } }
            ]);

            // Métricas de clientes generales
            const totalCustomers = customerMetrics.length;
            const totalRevenue = customerMetrics.reduce((sum, customer) => sum + customer.totalSpent, 0);
            const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
            const recurringCustomers = customerMetrics.filter(c => c.orderCount > 1).length;
            const newCustomers = totalCustomers - recurringCustomers;

            return {
                topCustomers: customerMetrics,
                newCustomersThisMonth,
                summary: {
                    totalCustomers,
                    newCustomers,
                    recurringCustomers,
                    avgCustomerValue: Math.round(avgCustomerValue),
                    totalRevenue
                }
            };
        } catch (error) {
            console.error('❌ Error en getCustomerMetricsGeneral:', error);
            return {
                topCustomers: [],
                newCustomersThisMonth: [],
                summary: {
                    totalCustomers: 0,
                    newCustomers: 0,
                    recurringCustomers: 0,
                    avgCustomerValue: 0,
                    totalRevenue: 0
                }
            };
        }
    };

    // 📊 Distribución de estados general (todos los tiempos)
    getOrdersByStatusGeneral = async (storeId) => {
        try {
            const statusDistribution = await Orders.aggregate([
                {
                    $match: {
                        storeId: storeId
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalValue: { $sum: '$finalPrice' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        status: '$_id',
                        count: 1,
                        totalValue: 1
                    }
                },
                { $sort: { count: -1 } }
            ]);

            return statusDistribution;
        } catch (error) {
            console.error('❌ Error en getOrdersByStatusGeneral:', error);
            return [];
        }
    };
}

export default StoreMetricsService;
