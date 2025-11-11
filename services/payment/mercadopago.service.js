import connectMongoDB from '../../libs/mongoose.js';
import PaymentTransaction from '../../models/PaymentTransaction.js';
import ClientOrderService from '../client/ClientOrderService.js';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

export default class MercadoPagoService {
    constructor() {
        connectMongoDB();
        
        // Configurar Mercado Pago
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!accessToken) {
            console.warn('⚠️ [MercadoPago] MERCADOPAGO_ACCESS_TOKEN no configurado');
        }
        
        const client = new MercadoPagoConfig({ 
            accessToken: accessToken || 'TEST-TOKEN',
            options: { 
                timeout: 5000,
                // Forzar modo test si el token es de prueba
                // Mercado Pago detecta automáticamente el ambiente basado en el token
            }
        });
        
        console.log('🔑 [MercadoPago] Token configurado:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NO CONFIGURADO');
        
        this.preference = new Preference(client);
        this.payment = new Payment(client);
        this.orderService = new ClientOrderService();
        this.testPayerEmail = process.env.MERCADOPAGO_TEST_PAYER_EMAIL;
        // Inicializar cliente de MerchantOrder si está disponible en el SDK
        try {
            this.merchantOrder = new MerchantOrder(client);
        } catch (e) {
            console.log('ℹ️ [MercadoPago] MerchantOrder no disponible en este entorno/versión');
            this.merchantOrder = null;
        }
        
        // URL del backend para callbacks
        const backendUrl = process.env.BACKEND_URL || 'https://gobackend-qomm.onrender.com';
        this.backendUrl = backendUrl;
    }

    // Determina si un valor parece un payment_id válido (numérico)
    isPaymentIdLike = (value) => {
        if (value === null || value === undefined) return false;
        const s = String(value).trim();
        return /^[0-9]+$/.test(s);
    };

    // Crear preferencia de pago (equivalente a createTransaction de Webpay)
    createPreference = async ({ amount, buyOrder, sessionId, payload }) => {
        try {
            // Validaciones
            if (!amount || typeof amount !== 'number' || amount <= 0) {
                return {
                    success: false,
                    message: 'Monto inválido',
                    error: 'El monto debe ser un número mayor a 0'
                };
            }

            if (!buyOrder || typeof buyOrder !== 'string' || buyOrder.trim().length === 0) {
                return {
                    success: false,
                    message: 'BuyOrder inválido',
                    error: 'El buyOrder es requerido'
                };
            }

            if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
                return {
                    success: false,
                    message: 'SessionId inválido',
                    error: 'El sessionId es requerido'
                };
            }

            // Verificar que el access token esté configurado
            const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
            if (!accessToken || accessToken === 'TEST-TOKEN') {
                console.error('❌ [MercadoPago] MERCADOPAGO_ACCESS_TOKEN no configurado');
                return {
                    success: false,
                    message: 'Mercado Pago no está configurado correctamente',
                    error: 'Falta configurar MERCADOPAGO_ACCESS_TOKEN en las variables de entorno'
                };
            }

            console.log('📥 [MercadoPago] Creando preferencia:', { amount, buyOrder, sessionId });
            console.log('🌐 [MercadoPago] Backend URL:', this.backendUrl);

            // Validar que backendUrl esté definido
            if (!this.backendUrl || this.backendUrl.trim() === '') {
                console.error('❌ [MercadoPago] BACKEND_URL no está configurado');
                return {
                    success: false,
                    message: 'Error de configuración del servidor',
                    error: 'BACKEND_URL no está configurado en las variables de entorno'
                };
            }

            // Crear preferencia en Mercado Pago
            const successUrl = `${this.backendUrl}/api/payment/mercadopago/result?status=approved`;
            const failureUrl = `${this.backendUrl}/api/payment/mercadopago/result?status=rejected`;
            const pendingUrl = `${this.backendUrl}/api/payment/mercadopago/result?status=pending`;
            const webhookUrl = `${this.backendUrl}/api/payment/mercadopago/webhook`;

            // Detectar si estamos en desarrollo local
            const isLocal = this.backendUrl.includes('localhost') || 
                           this.backendUrl.includes('192.168') || 
                           this.backendUrl.includes('127.0.0.1');

            console.log('🔗 [MercadoPago] URLs configuradas:', {
                success: successUrl,
                failure: failureUrl,
                pending: pendingUrl,
                webhook: webhookUrl,
                isLocal: isLocal
            });

            const payerEmail = this.testPayerEmail || payload?.customer?.email || 'customer@example.com';

            if (this.testPayerEmail) {
                console.log('🧪 [MercadoPago] Usando MERCADOPAGO_TEST_PAYER_EMAIL para sandbox:', this.testPayerEmail);
            }

            const preferenceData = {
                items: [
                    {
                        title: `Orden ${buyOrder}`,
                        quantity: 1,
                        unit_price: amount,
                        currency_id: 'CLP'
                    }
                ],
                payer: {
                    email: payerEmail
                },
                back_urls: {
                    success: successUrl,
                    failure: failureUrl,
                    pending: pendingUrl
                },
                // auto_return solo funciona con URLs públicas accesibles desde Mercado Pago
                auto_return: isLocal ? undefined : 'approved',
                external_reference: buyOrder,
                // notification_url solo se incluye si la URL es pública (Mercado Pago rechaza URLs locales)
                ...(isLocal ? {} : { notification_url: webhookUrl }),
                statement_descriptor: 'FLUVI'
            };

            let preference;
            try {
                preference = await this.preference.create({ body: preferenceData });
            } catch (mpError) {
                console.error('❌ [MercadoPago] Error de SDK al crear preferencia:', mpError);
                console.error('❌ [MercadoPago] Detalles del error:', {
                    message: mpError?.message,
                    cause: mpError?.cause,
                    status: mpError?.status,
                    statusCode: mpError?.statusCode
                });
                throw mpError;
            }
            
            if (!preference || !preference.id || !preference.init_point) {
                console.error('❌ [MercadoPago] Respuesta inválida:', preference);
                throw new Error('Respuesta inválida de Mercado Pago: falta id o init_point');
            }

            console.log('✅ [MercadoPago] Preferencia creada:', preference.id);

            // Guardar transacción en BD
            const transaction = new PaymentTransaction({
                token: preference.id, // Usamos preference_id como token
                buyOrder,
                sessionId,
                amount,
                status: 'PENDING',
                paymentMethod: 'mercadopago',
                response: preference,
                payload
            });

            await transaction.save();

            return {
                success: true,
                message: 'Preferencia de pago creada',
                data: {
                    token: preference.id,
                    url: preference.init_point, // URL para redirigir al usuario
                    preference_id: preference.id
                }
            };
        } catch (err) {
            console.error('❌ [MercadoPago] Error creando preferencia:', err);
            console.error('❌ [MercadoPago] Stack trace:', err?.stack);
            return {
                success: false,
                message: 'Error al crear preferencia de pago',
                error: err?.message || err?.toString() || 'Error desconocido'
            };
        }
    };

    // Obtener estado de un pago
    getPaymentStatus = async (token) => {
        try {
            // Validar token
            if (!token || (typeof token !== 'string' && typeof token !== 'number')) {
                return {
                    success: false,
                    message: 'Token inválido',
                    error: 'El token es requerido y debe ser string o number'
                };
            }

            console.log('📥 [MercadoPago] Consultando estado de pago:', token);

            // Buscar en BD primero
            let trx = await PaymentTransaction.findOne({ 
                token,
                paymentMethod: 'mercadopago'
            });

            // Sólo tratar como final AUTHORIZED, CANCELED, REFUNDED o CHARGED_BACK.
            // REJECTED NO es final porque MP permite reintentos dentro de la misma preferencia.
            if (trx && ['AUTHORIZED', 'CANCELED', 'REFUNDED', 'CHARGED_BACK'].includes(trx.status)) {
                console.log(`✅ [MercadoPago] Estado final encontrado en BD (${trx.status}), evitando llamada externa`);
                return {
                    success: true,
                    message: 'Estado de pago obtenido desde BD (final)',
                    data: {
                        token: trx.token,
                        status: trx.status,
                        response: trx.response
                    }
                };
            }

            // Si encontramos la transacción y parece tener un payment_id en el response, intentar obtener estado actualizado
            const expectedPreferenceId = trx?.token;
            const expectedExternalRef = trx?.buyOrder;
            if (trx?.response?.id && this.isPaymentIdLike(trx.response.id)) {
                try {
                    const mpPayment = await this.payment.get({ id: trx.response.id });
                    if (mpPayment) {
                        const samePreference = mpPayment?.preference_id === expectedPreferenceId;
                        const sameExternal = mpPayment?.external_reference === expectedExternalRef;
                        let normalizedStatus = this.normalizeStatus(mpPayment.status);
                        if (mpPayment?.status === 'approved' && mpPayment?.status_detail !== 'accredited') {
                            normalizedStatus = 'PENDING';
                        }
                        if (samePreference && sameExternal) {
                            trx.status = normalizedStatus;
                            trx.response = mpPayment;
                            await trx.save();

                        return {
                            success: true,
                            message: 'Estado de pago actualizado desde Mercado Pago',
                            data: {
                                token: token,
                                status: normalizedStatus,
                                response: mpPayment
                            }
                        };
                        } else {
                            console.log('⚠️ [MercadoPago] Pago obtenido por id no corresponde a la transacción esperada. Ignorando.');
                        }
                    }
                } catch (err) {
                    console.log('⚠️ [MercadoPago] No se pudo obtener pago actualizado, usando estado de BD');
                }
            }

            // Intentar obtener el pago directamente (puede ser payment_id)
            try {
                if (this.isPaymentIdLike(token)) {
                    const mpPayment = await this.payment.get({ id: token });
                    if (mpPayment) {
                        const samePreference = mpPayment?.preference_id === expectedPreferenceId;
                        const sameExternal = mpPayment?.external_reference === expectedExternalRef;
                        let normalizedStatus = this.normalizeStatus(mpPayment.status);
                        if (mpPayment?.status === 'approved' && mpPayment?.status_detail !== 'accredited') {
                            normalizedStatus = 'PENDING';
                        }
                        
                        if (samePreference && sameExternal) {
                            // Actualizar o crear transacción
                            if (trx) {
                                trx.status = normalizedStatus;
                                trx.response = mpPayment;
                                await trx.save();
                            } else {
                                // Crear nueva transacción si no existe
                                trx = new PaymentTransaction({
                                    token: mpPayment.preference_id || token,
                                    buyOrder: mpPayment.external_reference || `MP-${token}`,
                                    sessionId: mpPayment.payer?.id?.toString() || 'unknown',
                                    amount: mpPayment.transaction_amount,
                                    status: normalizedStatus,
                                    paymentMethod: 'mercadopago',
                                    response: mpPayment
                                });
                                await trx.save();
                            }

                            return {
                                success: true,
                                message: 'Estado de pago obtenido desde Mercado Pago',
                                data: {
                                    token: token,
                                    status: normalizedStatus,
                                    response: mpPayment
                                }
                            };
                        } else {
                            console.log('⚠️ [MercadoPago] Pago por token no corresponde a la transacción esperada. Ignorando.');
                        }
                    }
                }
            } catch (err) {
                // Si falla, puede ser que sea un preference_id (no se puede obtener pago directamente)
                console.log('⚠️ [MercadoPago] No se pudo obtener pago directamente, puede ser preference_id');
            }

            // Intentar buscar por external_reference (buyOrder)
            if (trx?.buyOrder) {
                try {
                    const searchResult = await this.payment.search({
                        qs: {
                            external_reference: trx.buyOrder,
                            sort: 'date_created',
                            criteria: 'desc'
                        }
                    });

                    const candidates = Array.isArray(searchResult?.results) ? searchResult.results : [];
                    // Filtrar coincidencia estricta por preference_id y external_reference
                    const mpPayment = candidates.find(p => p?.preference_id === expectedPreferenceId && p?.external_reference === expectedExternalRef);
                    if (mpPayment) {
                        let normalizedStatus = this.normalizeStatus(mpPayment.status);
                        if (mpPayment?.status === 'approved' && mpPayment?.status_detail !== 'accredited') {
                            normalizedStatus = 'PENDING';
                        }
                        trx.status = normalizedStatus;
                        trx.response = mpPayment;
                        await trx.save();

                        return {
                            success: true,
                            message: 'Estado de pago obtenido desde búsqueda en Mercado Pago',
                            data: {
                                token: token,
                                status: normalizedStatus,
                                response: mpPayment
                            }
                        };
                    }
                } catch (err) {
                    console.log('⚠️ [MercadoPago] No se pudo obtener pago por búsqueda, usando estado de BD');
                }
            }

            // Fallback adicional: reconciliar por Merchant Order usando preference_id cuando no hay payment_id ni resultado en /payments/search
            try {
                if (expectedPreferenceId) {
                    // Preferir SDK si está disponible; si no, usar HTTP directo
                    let orders = [];
                    if (this.merchantOrder?.search) {
                        const mo = await this.merchantOrder.search({
                            qs: { preference_id: String(expectedPreferenceId), sort: 'date_desc' }
                        });
                        orders = Array.isArray(mo?.elements) ? mo.elements : [];
                    } else {
                        // HTTP directo
                        const url = `https://api.mercadopago.com/merchant_orders/search?preference_id=${encodeURIComponent(String(expectedPreferenceId))}`;
                        const resp = await (await import('node-fetch')).default(url, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        if (resp.ok) {
                            const json = await resp.json();
                            orders = Array.isArray(json?.elements) ? json.elements : [];
                        } else {
                            console.log('⚠️ [MercadoPago] HTTP merchant_orders/search status:', resp.status);
                        }
                    }
                    const order = orders.find(o => o?.preference_id === expectedPreferenceId) || null;
                    if (order && Array.isArray(order.payments)) {
                        for (const p of order.payments) {
                            const ps = String(p?.status || '').toLowerCase();
                            const pd = String(p?.status_detail || '').toLowerCase();
                            if (ps === 'approved' && pd === 'accredited') {
                                // Confirmar con payments.get para estado más reciente
                                let full = null;
                                try { full = await this.payment.get({ id: p.id }); } catch {}
                                const resp = full || p;
                                const isAcc = resp?.status === 'approved' && String(resp?.status_detail || '').toLowerCase() === 'accredited';
                                if (isAcc) {
                                    trx.status = 'AUTHORIZED';
                                    trx.response = resp;
                                    await trx.save();
                                    return {
                                        success: true,
                                        message: 'Estado de pago confirmado por MerchantOrder (pull, sin redirect)',
                                        data: { token: trx.token, status: 'AUTHORIZED', response: resp }
                                    };
                                }
                            } else if (ps === 'rejected') {
                                trx.status = 'REJECTED';
                                trx.response = p;
                                await trx.save();
                                return {
                                    success: true,
                                    message: 'Pago rechazado confirmado por MerchantOrder',
                                    data: { token: trx.token, status: 'REJECTED', response: p }
                                };
                            } else if (ps === 'cancelled' || ps === 'canceled') {
                                trx.status = 'CANCELED';
                                trx.response = p;
                                await trx.save();
                                return {
                                    success: true,
                                    message: 'Pago cancelado confirmado por MerchantOrder',
                                    data: { token: trx.token, status: 'CANCELED', response: p }
                                };
                            }
                        }
                    }
                }
            } catch (e) {
                console.log('⚠️ [MercadoPago] merchant_orders.search sin confirmación aún:', e?.message || e);
            }
            // Si hay transacción en BD, devolver su estado
            if (trx) {
                return {
                    success: true,
                    message: 'Estado de transacción obtenido desde BD',
                    data: {
                        token: trx.token,
                        status: trx.status,
                        response: trx.response
                    }
                };
            }

            return {
                success: false,
                message: 'Pago no encontrado'
            };
        } catch (err) {
            console.error('❌ [MercadoPago] Error consultando estado:', err);
            return {
                success: false,
                message: 'Error al consultar estado de pago',
                error: err?.message || err
            };
        }
    };

    // Procesar webhook de Mercado Pago
    processWebhook = async (data) => {
        try {
            console.log('📥 [MercadoPago] Webhook recibido:', data);

            // Validar estructura del webhook
            if (!data || typeof data !== 'object') {
                return {
                    success: false,
                    message: 'Datos del webhook inválidos',
                    error: 'El webhook debe ser un objeto'
                };
            }

            const { type, data: webhookData } = data;

            if (!type || type !== 'payment') {
                return {
                    success: true,
                    message: 'Webhook recibido pero no es de tipo payment',
                    data: { type }
                };
            }

            if (!webhookData || !webhookData.id) {
                return {
                    success: false,
                    message: 'Webhook de pago sin ID',
                    error: 'El webhook debe contener data.id'
                };
            }

            const paymentId = webhookData.id;
            
            // Obtener información completa del pago
            const payment = await this.payment.get({ id: paymentId });
            
            if (!payment) {
                console.error('❌ [MercadoPago] Pago no encontrado en webhook:', paymentId);
                return { success: false, message: 'Pago no encontrado' };
            }

            // Endurecer aprobación: sólo considerar AUTHORIZED cuando status_detail sea 'accredited'
            let status = this.normalizeStatus(payment.status);
            if (payment?.status === 'approved' && payment?.status_detail !== 'accredited') {
                status = 'PENDING';
            }
            const externalReference = payment.external_reference; // buyOrder

            console.log('✅ [MercadoPago] Pago procesado:', { paymentId, status, externalReference });

            // Buscar transacción por buyOrder o preference_id
            let trx = await PaymentTransaction.findOne({
                $or: [
                    { buyOrder: externalReference, paymentMethod: 'mercadopago' },
                    { token: payment.preference_id, paymentMethod: 'mercadopago' }
                ]
            });

            if (!trx) {
                console.warn('⚠️ [MercadoPago] Transacción no encontrada, creando nueva...');
                trx = new PaymentTransaction({
                    token: payment.preference_id || paymentId,
                    buyOrder: externalReference || `MP-${paymentId}`,
                    sessionId: payment.payer?.id?.toString() || 'unknown',
                    amount: payment.transaction_amount,
                    status: status,
                    paymentMethod: 'mercadopago',
                    response: payment
                });
            } else {
                // Si el intento fue cancelado en nuestra app, no permitir que el webhook lo reabra
                if (trx.status === 'CANCELED') {
                    console.log('🛑 [MercadoPago] Webhook ignorado: transacción marcada como CANCELED en nuestra BD.');
                    // Opcional: podríamos registrar el intento en response sin cambiar estado
                    trx.response = payment;
                    await trx.save();
                    return { success: true, message: 'Transacción cancelada previamente; webhook ignorado', data: { paymentId, status: 'CANCELED' } };
                }
                trx.status = status;
                trx.response = payment;
                trx.token = payment.preference_id || paymentId; // Actualizar con preference_id si existe
            }

            await trx.save();

            // Importante: NO crear pedido automáticamente desde webhook.
            // El pedido se creará sólo desde el frontend tras confirmar estado y con payload válido.

            return {
                success: true,
                message: 'Webhook procesado correctamente',
                data: { paymentId, status }
            };
        } catch (err) {
            console.error('❌ [MercadoPago] Error procesando webhook:', err);
            return {
                success: false,
                message: 'Error procesando webhook',
                error: err?.message || err
            };
        }
    };

    // Normalizar estados de Mercado Pago a estados internos
    normalizeStatus = (mpStatus) => {
        const statusMap = {
            'pending': 'PENDING',
            'approved': 'AUTHORIZED',
            'rejected': 'REJECTED',
            'cancelled': 'CANCELED',
            'canceled': 'CANCELED',
            'refunded': 'REFUNDED',
            'charged_back': 'CHARGED_BACK',
            'in_process': 'PENDING',
            'in_mediation': 'PENDING'
        };

        const normalized = statusMap[mpStatus?.toLowerCase()] || mpStatus?.toUpperCase() || 'UNKNOWN';
        
        // Mapear también estados que ya están en mayúsculas
        if (normalized === 'UNKNOWN' && mpStatus) {
            const upperStatus = mpStatus.toUpperCase();
            if (upperStatus === 'AUTHORIZED' || upperStatus === 'REJECTED' || upperStatus === 'PENDING' || upperStatus === 'CANCELED') {
                return upperStatus;
            }
        }
        
        return normalized;
    };

    // Obtener información completa de una transacción
    getTransactionInfo = async (token) => {
        try {
            // Validar token
            if (!token || (typeof token !== 'string' && typeof token !== 'number')) {
                return {
                    success: false,
                    message: 'Token inválido',
                    error: 'El token es requerido y debe ser string o number'
                };
            }

            const trx = await PaymentTransaction.findOne({ 
                token,
                paymentMethod: 'mercadopago'
            }).lean();

            if (!trx) {
                return {
                    success: false,
                    message: 'Transacción no encontrada',
                    data: null
                };
            }

            // Intentar obtener información actualizada de MP
            let mpPayment = null;
            try {
                // Si el token es un payment_id, obtener directamente
                if (trx.response?.id) {
                    mpPayment = await this.payment.get({ id: trx.response.id });
                }
            } catch (err) {
                console.log('⚠️ [MercadoPago] No se pudo obtener pago actualizado de MP, usando datos de BD');
            }

            const now = new Date();
            const trxDate = new Date(trx.createdAt);
            const minutesSince = Math.round((now - trxDate) / (1000 * 60));
            const isExpired = minutesSince > 10 && ['PENDING', 'INITIALIZED'].includes(trx.status);

            return {
                success: true,
                message: 'Información de transacción obtenida',
                data: {
                    transaction: {
                        ...trx,
                        minutesSince,
                        isExpired,
                        canContinue: !isExpired && ['PENDING', 'INITIALIZED'].includes(trx.status)
                    },
                    mpPayment
                }
            };
        } catch (err) {
            console.error('❌ [MercadoPago] Error obteniendo información:', err);
            return {
                success: false,
                message: 'Error al obtener información de transacción',
                error: err?.message || err
            };
        }
    };

    // Buscar pedido asociado a una transacción
    getOrderByTransactionToken = async (token) => {
        try {
            const trx = await PaymentTransaction.findOne({ 
                token,
                paymentMethod: 'mercadopago'
            }).lean();

            if (!trx) {
                return {
                    success: false,
                    message: 'Transacción no encontrada',
                    data: null
                };
            }

            if (trx.orderId) {
                const Order = (await import('../../models/Orders.js')).default;
                const order = await Order.findById(trx.orderId).lean();
                if (order) {
                    return {
                        success: true,
                        message: 'Pedido encontrado',
                        data: { order, transaction: trx }
                    };
                }
            }

            // NO hacer búsqueda heurística por customer/amount para evitar falsos positivos.
            // El pedido debe estar vinculado explícitamente por orderId asociado a esta transacción.

            return {
                success: false,
                message: 'No se encontró pedido asociado a esta transacción',
                data: { transaction: trx, order: null }
            };
        } catch (err) {
            console.error('❌ [MercadoPago] Error buscando pedido por token:', err);
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
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const transactions = await PaymentTransaction.find({
                sessionId,
                paymentMethod: 'mercadopago',
                status: { $in: ['PENDING', 'INITIALIZED'] },
                createdAt: { $gte: oneDayAgo }
            }).sort({ createdAt: -1 }).lean();

            const now = new Date();
            const active = [];
            const expired = [];

            transactions.forEach(trx => {
                const trxDate = new Date(trx.createdAt);
                const minutesSince = (now - trxDate) / (1000 * 60);
                
                if (minutesSince < 10) {
                    active.push(trx);
                } else {
                    expired.push(trx);
                }
            });

            return {
                success: true,
                message: 'Transacciones pendientes obtenidas',
                data: {
                    active,
                    expired,
                    total: transactions.length
                }
            };
        } catch (err) {
            console.error('❌ [MercadoPago] Error obteniendo transacciones pendientes:', err);
            return {
                success: false,
                message: 'Error al obtener transacciones pendientes',
                error: err?.message || err
            };
        }
    };

    // Cancelar transacción por el usuario (solo local; no intenta anular en MP si no hay payment_id)
    cancelTransaction = async (token, reason = 'user_cancelled') => {
        try {
            if (!token) {
                return { success: false, message: 'Token es requerido' };
            }
            const trx = await PaymentTransaction.findOne({
                token,
                paymentMethod: 'mercadopago'
            });
            if (!trx) {
                return { success: false, message: 'Transacción no encontrada' };
            }

            if (['AUTHORIZED', 'CANCELED', 'REFUNDED', 'CHARGED_BACK'].includes(trx.status)) {
                return { success: true, message: 'Transacción ya finalizada', data: { status: trx.status } };
            }

            trx.status = 'CANCELED';
            trx.cancelledBy = 'user';
            trx.cancelledAt = new Date();
            trx.cancelReason = reason;
            await trx.save();

            // Intentar invalidar la preferencia en Mercado Pago para evitar pagos posteriores
            try {
                if (this.preference && trx.token) {
                    const expirationNow = new Date(Date.now() - 10 * 1000).toISOString();
                    await this.preference.update({
                        id: trx.token,
                        body: {
                            expires: true,
                            // Opcional: fijar ventana cerrada inmediatamente
                            expiration_date_to: expirationNow
                        }
                    });
                    console.log(`🛑 [MercadoPago] Preferencia ${trx.token} expirada inmediatamente tras cancelación.`);
                }
            } catch (expErr) {
                console.log('⚠️ [MercadoPago] No se pudo expirar preferencia al cancelar:', expErr?.message || expErr);
            }

            return { success: true, message: 'Transacción cancelada por el usuario', data: { status: trx.status } };
        } catch (err) {
            console.error('❌ [MercadoPago] Error cancelando transacción:', err);
            return { success: false, message: 'Error cancelando transacción', error: err?.message || err };
        }
    };

    // Vincular un pedido a una transacción por token (idempotente)
    linkOrderToTransaction = async (token, orderId) => {
        try {
            if (!token || !orderId) {
                return { success: false, message: 'token y orderId son requeridos' };
            }

            const trx = await PaymentTransaction.findOne({
                token,
                paymentMethod: 'mercadopago'
            });

            if (!trx) {
                return { success: false, message: 'Transacción no encontrada' };
            }

            // Opcional: requerir que el pago esté realmente autorizado
            if (trx.status !== 'AUTHORIZED') {
                return { success: false, message: 'Transacción no autorizada para vincular pedido' };
            }

            if (trx.orderCreated && trx.orderId) {
                // Ya vinculado
                return { success: true, message: 'Pedido ya vinculado', data: { orderId: trx.orderId } };
            }

            trx.orderCreated = true;
            trx.orderId = orderId;
            await trx.save();

            return { success: true, message: 'Pedido vinculado a transacción', data: { orderId } };
        } catch (err) {
            console.error('❌ [MercadoPago] Error vinculando pedido a transacción:', err);
            return { success: false, message: 'Error vinculando pedido', error: err?.message || err };
        }
    };
}

