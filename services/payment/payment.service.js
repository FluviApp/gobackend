import connectMongoDB from '../../libs/mongoose.js';
import PaymentTransaction from '../../models/PaymentTransaction.js';
import Order from '../../models/Orders.js';
import ClientOrderService from '../client/ClientOrderService.js';
import pkg from 'transbank-sdk';

const {
    WebpayPlus,
    IntegrationCommerceCodes,
    IntegrationApiKeys
} = pkg;

export default class PaymentService {
    constructor() {
        connectMongoDB();
        // URL del backend (puede ser local o producción según NODE_ENV)
        const backendUrl = process.env.BACKEND_URL || 'https://gobackend-qomm.onrender.com';
        this.returnUrl = `${backendUrl}/api/payment/webpay-result`;

        // Instancia del servicio de órdenes para crear pedidos
        this.orderService = new ClientOrderService();

        // Creamos la instancia de transacción configurada para integración
        this.transaction = WebpayPlus.Transaction.buildForIntegration(
            IntegrationCommerceCodes.WEBPAY_PLUS,
            IntegrationApiKeys.WEBPAY
        );
    }

    createTransaction = async ({ amount, buyOrder, sessionId, payload }) => {
        console.log('📥 [createTransaction] Iniciando con:', { amount, buyOrder, sessionId });

        // Verifica configuración del SDK
        console.log('⚙️ [createTransaction] Configuración actual del SDK:');
        console.log('   Commerce Code:', IntegrationCommerceCodes.WEBPAY_PLUS);
        console.log('   API Key:', IntegrationApiKeys.WEBPAY);
        console.log('   Return URL:', this.returnUrl);
        console.log('   NODE_ENV:', process.env.NODE_ENV);

        try {
            console.log('🔧 [createTransaction] Llamando a WebpayPlus.Transaction.create...');
            const trx = await this.transaction.create(
                buyOrder,
                sessionId,
                amount,
                this.returnUrl
            );

            console.log('🔁 [createTransaction] Respuesta de Transbank.create():', trx);

            if (!trx?.token || !trx?.url) {
                console.error('❌ [createTransaction] Transbank no retornó token o url');
                throw new Error('Error al iniciar transacción con Transbank');
            }

            console.log('💾 [createTransaction] Guardando transacción en MongoDB...');
            console.log('📦 [createTransaction] Payload recibido:', payload ? JSON.stringify(payload).substring(0, 200) : 'null');
            console.log('📦 [createTransaction] Payload tipo:', typeof payload);

            const transactionData = {
                token: trx.token,
                buyOrder,
                sessionId,
                amount,
                status: 'CREATED',
                paymentMethod: 'webpay',
                payload
            };

            console.log('💾 [createTransaction] Datos a guardar:', {
                token: transactionData.token,
                buyOrder: transactionData.buyOrder,
                sessionId: transactionData.sessionId,
                amount: transactionData.amount,
                status: transactionData.status,
                hasPayload: !!transactionData.payload
            });

            await PaymentTransaction.create(transactionData);

            console.log('✅ [createTransaction] Transacción registrada y retornada al cliente');

            return {
                success: true,
                message: 'Transacción iniciada',
                data: {
                    token: trx.token,
                    url: trx.url
                }
            };
        } catch (err) {
            console.error('❌ [createTransaction] Error al crear transacción:', err);
            return {
                success: false,
                message: 'Error al crear transacción',
                error: err?.message || err
            };
        }
    };



    // commitTransaction = async (token) => {
    //     const result = await this.transaction.commit(token);

    //     const trx = await PaymentTransaction.findOneAndUpdate(
    //         { token },
    //         { status: result.status, response: result },
    //         { new: true }
    //     );

    //     return {
    //         success: true,
    //         message: 'Transacción confirmada',
    //         data: trx
    //     };
    // };
    commitTransaction = async (token) => {
        try {
            const result = await this.transaction.commit(token);

            // Recupera la transacción con payload
            const trx = await PaymentTransaction.findOneAndUpdate(
                { token },
                { status: result.status, response: result },
                { new: true }
            );

            // ✅ Si fue exitoso, crea el pedido directamente usando el servicio de órdenes
            console.log('🔍 Verificando condiciones para crear pedido:');
            console.log('   - result.status:', result.status);
            console.log('   - trx existe:', !!trx);
            console.log('   - trx.payload existe:', !!trx?.payload);
            console.log('   - trx.orderCreated:', trx?.orderCreated);
            console.log('   - trx.payload tipo:', typeof trx?.payload);
            console.log('   - trx.payload contenido:', trx?.payload ? JSON.stringify(trx.payload).substring(0, 200) : 'null');

            // Verificar si el pedido ya fue creado para evitar duplicados
            if (trx?.orderCreated) {
                console.log('⚠️ El pedido ya fue creado anteriormente para esta transacción. Saltando creación.');
                if (trx?.orderId) {
                    console.log('   - ID del pedido existente:', trx.orderId);
                }
            } else if (result.status === 'AUTHORIZED' && trx?.payload) {
                console.log('🛒 Creando pedido automáticamente desde backend...');
                console.log('📦 Payload completo:', JSON.stringify(trx.payload, null, 2));
                try {
                    const orderResult = await this.orderService.createOrder(trx.payload);
                    if (orderResult?.success) {
                        const orderId = orderResult.data?.order?._id || orderResult.data?._id;
                        console.log('✅ Pedido creado desde backend:', orderId);

                        // Marcar la transacción como procesada y guardar el ID del pedido
                        await PaymentTransaction.findOneAndUpdate(
                            { token },
                            { orderCreated: true, orderId },
                            { new: true }
                        );
                        console.log('✅ Transacción marcada como procesada');
                    } else {
                        console.error('❌ Error al crear el pedido:', orderResult?.message);
                        console.error('❌ Detalles del error:', JSON.stringify(orderResult, null, 2));
                    }
                } catch (err) {
                    console.error('❌ Error al crear el pedido desde backend:', err);
                    console.error('❌ Stack trace:', err?.stack);
                }
            } else {
                console.warn('⚠️ No se puede crear el pedido:');
                if (result.status !== 'AUTHORIZED') {
                    console.warn('   - Status no es AUTHORIZED:', result.status);
                }
                if (!trx?.payload) {
                    console.warn('   - No hay payload en la transacción');
                }
            }

            return {
                success: true,
                message: 'Transacción confirmada',
                data: trx
            };
        } catch (err) {
            console.error('❌ Error en commitTransaction:', err);
            return {
                success: false,
                message: 'Error al confirmar transacción',
                error: err?.message || err
            };
        }
    };


    getTransactionStatus = async (token) => {
        try {
            // 🔍 Consulta estado real en Transbank
            const realStatus = await this.transaction.status(token);

            // 🔄 Actualiza base de datos si la transacción existe
            const updatedTrx = await PaymentTransaction.findOneAndUpdate(
                { token },
                { status: realStatus.status, response: realStatus },
                { new: true }
            );

            // ✅ Asegurar estructura consistente para el frontend
            // El frontend espera: res?.data?.response?.status
            const responseData = updatedTrx ? {
                token: updatedTrx.token || token,
                status: updatedTrx.status || realStatus.status,
                response: updatedTrx.response || realStatus // response contiene toda la info de Transbank
            } : {
                token,
                status: realStatus.status,
                response: realStatus
            };

            return {
                success: true,
                message: 'Estado de transacción actualizado desde Transbank',
                data: responseData
            };
        } catch (err) {
            console.error('❌ Error al consultar estado:', err);
            return {
                success: false,
                message: 'Error al obtener estado de transacción',
                error: err?.message || err
            };
        }
    };


    deleteTransaction = async (token) => {
        const trx = await PaymentTransaction.findOneAndDelete({ token });
        if (!trx) {
            return { success: false, message: 'Transacción no encontrada' };
        }

        return {
            success: true,
            message: 'Transacción eliminada correctamente',
            data: trx
        };
    };

    getTransactionHistory = async ({ userId, buyOrder }) => {
        const filter = {};
        if (userId) filter.sessionId = userId;
        if (buyOrder) filter.buyOrder = buyOrder;

        const transactions = await PaymentTransaction.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        return {
            success: true,
            message: 'Historial obtenido',
            data: transactions
        };
    };

    // Buscar pedido asociado a una transacción por token
    getOrderByTransactionToken = async (token) => {
        try {
            // Primero buscar la transacción
            const trx = await PaymentTransaction.findOne({ token }).lean();

            if (!trx) {
                return {
                    success: false,
                    message: 'Transacción no encontrada',
                    data: null
                };
            }

            // Si la transacción tiene orderId, buscar directamente
            if (trx.orderId) {
                const order = await Order.findById(trx.orderId).lean();
                if (order) {
                    return {
                        success: true,
                        message: 'Pedido encontrado',
                        data: { order, transaction: trx }
                    };
                }
            }

            // Si no tiene orderId pero está AUTHORIZED, buscar por buyOrder y datos del payload
            if (trx.status === 'AUTHORIZED' && trx.payload) {
                const { customer, buyOrder: payloadBuyOrder } = trx.payload;

                // Buscar pedido reciente (últimas 24 horas) con mismo customer y paymentMethod webpay
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const order = await Order.findOne({
                    'customer.id': customer?.id,
                    paymentMethod: 'webpay',
                    createdAt: { $gte: oneDayAgo },
                    price: trx.amount
                })
                    .sort({ createdAt: -1 })
                    .lean();

                if (order) {
                    return {
                        success: true,
                        message: 'Pedido encontrado por coincidencia',
                        data: { order, transaction: trx }
                    };
                }
            }

            return {
                success: false,
                message: 'No se encontró pedido asociado a esta transacción',
                data: { transaction: trx, order: null }
            };
        } catch (err) {
            console.error('❌ Error buscando pedido por token:', err);
            return {
                success: false,
                message: 'Error al buscar pedido',
                error: err?.message || err
            };
        }
    };

    // Obtener transacciones pendientes de un usuario
    getPendingTransactions = async (sessionId) => {
        try {
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Buscar transacciones pendientes (INITIALIZED o CREATED) de las últimas 24 horas
            // pero solo considerar las que tienen menos de 10 minutos como "activas"
            const transactions = await PaymentTransaction.find({
                sessionId,
                status: { $in: ['INITIALIZED', 'CREATED'] },
                createdAt: { $gte: oneDayAgo }
            })
                .sort({ createdAt: -1 })
                .lean();

            // Separar en activas (< 10 min) y expiradas
            const now = new Date();
            const active = [];
            const expired = [];

            transactions.forEach(trx => {
                const trxDate = new Date(trx.createdAt);
                const minutesSince = (now - trxDate) / (1000 * 60);

                if (minutesSince < 10) {
                    active.push({ ...trx, minutesSince: Math.round(minutesSince) });
                } else {
                    expired.push({ ...trx, minutesSince: Math.round(minutesSince) });
                }
            });

            return {
                success: true,
                message: 'Transacciones pendientes obtenidas',
                data: {
                    active, // Transacciones que aún pueden continuarse
                    expired, // Transacciones que expiraron pero aún no se limpiaron
                    total: transactions.length
                }
            };
        } catch (err) {
            console.error('❌ Error obteniendo transacciones pendientes:', err);
            return {
                success: false,
                message: 'Error al obtener transacciones pendientes',
                error: err?.message || err
            };
        }
    };

    // Obtener información completa de una transacción (incluye pedido si existe)
    getTransactionInfo = async (token) => {
        try {
            const trx = await PaymentTransaction.findOne({ token }).lean();

            if (!trx) {
                return {
                    success: false,
                    message: 'Transacción no encontrada',
                    data: null
                };
            }

            let order = null;
            if (trx.orderId) {
                order = await Order.findById(trx.orderId).lean();
            }

            // Calcular tiempo transcurrido
            const now = new Date();
            const trxDate = new Date(trx.createdAt);
            const minutesSince = Math.round((now - trxDate) / (1000 * 60));
            const isExpired = minutesSince > 10 && trx.status === 'INITIALIZED';

            return {
                success: true,
                message: 'Información de transacción obtenida',
                data: {
                    transaction: {
                        ...trx,
                        minutesSince,
                        isExpired,
                        canContinue: !isExpired && ['INITIALIZED', 'CREATED'].includes(trx.status)
                    },
                    order
                }
            };
        } catch (err) {
            console.error('❌ Error obteniendo información de transacción:', err);
            return {
                success: false,
                message: 'Error al obtener información de transacción',
                error: err?.message || err
            };
        }
    };
}
