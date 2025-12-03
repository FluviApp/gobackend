// src/controllers/payment/MercadoPagoController.js

import MercadoPagoService from '../../services/payment/mercadopago.service.js';

const service = new MercadoPagoService();

export default class MercadoPagoController {
    // Crear preferencia de pago (iniciar transacción)
    createPreference = async (req, res) => {
        console.log('📥 [MercadoPago] createPreference request body:', req.body);

        const { amount, buyOrder, sessionId, payload } = req.body;

        // Validar datos requeridos
        if (!amount || !buyOrder || !sessionId) {
            console.warn('⚠️ [MercadoPago] Datos faltantes en la creación de preferencia');
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos: amount, buyOrder, sessionId',
            });
        }

        // Validar amount
        if (typeof amount !== 'number' || amount <= 0) {
            console.warn('⚠️ [MercadoPago] Monto inválido:', amount);
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser un número mayor a 0',
            });
        }

        try {
            const response = await service.createPreference({ amount, buyOrder, sessionId, payload });

            if (!response?.data?.token || !response?.data?.url) {
                console.warn('⚠️ [MercadoPago] Datos incompletos en la respuesta del servicio');
                return res.status(500).json({
                    success: false,
                    message: 'Error al generar datos de pago',
                });
            }

            console.log('✅ [MercadoPago] createPreference success:', response);
            return res.status(200).json(response);
        } catch (e) {
            console.error('❌ [MercadoPago] Error en createPreference:', e);
            return res.status(500).json({
                success: false,
                message: 'Error creando preferencia de pago',
                error: e?.message || e
            });
        }
    };

    // Obtener estado de un pago
    getPaymentStatus = async (req, res) => {
        const token = req.params.token;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token es requerido para consultar el estado',
            });
        }

        try {
            const response = await service.getPaymentStatus(token);
            // Si no se encontró, devolver 200 con success: false (no 404)
            // para que el frontend pueda manejar el caso
            if (!response.success && response.message === 'Pago no encontrado') {
                return res.status(200).json(response);
            }
            return res.status(response.success ? 200 : 500).json(response);
        } catch (e) {
            console.error('❌ [MercadoPago] Error en getPaymentStatus:', e);
            return res.status(500).json({
                success: false,
                message: 'Error consultando estado de pago',
                error: e?.message || e,
            });
        }
    };

    // Procesar webhook de Mercado Pago
    processWebhook = async (req, res) => {
        try {
            console.log('📥 [MercadoPago] Webhook recibido:', req.body);
            console.log('📥 [MercadoPago] Headers:', req.headers);

            // Mercado Pago puede enviar webhooks en formato JSON o form-urlencoded
            let webhookData = req.body;

            // Si viene como form-urlencoded, parsear manualmente
            if (typeof webhookData === 'string' || !webhookData.type) {
                // Intentar parsear como JSON si es string
                if (typeof webhookData === 'string') {
                    try {
                        webhookData = JSON.parse(webhookData);
                    } catch (e) {
                        // Si falla, puede ser form-urlencoded
                        console.log('⚠️ [MercadoPago] Intentando parsear como form-urlencoded...');
                    }
                }
            }

            const result = await service.processWebhook(webhookData);

            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (e) {
            console.error('❌ [MercadoPago] Error en processWebhook:', e);
            return res.status(500).json({
                success: false,
                message: 'Error procesando webhook',
                error: e?.message || e
            });
        }
    };

    // Resultado de redirección de Mercado Pago
    handleResult = async (req, res) => {
        const { status, payment_id, preference_id } = req.query;
        const frontendUrl = process.env.FRONTEND_URL || 'https://fluvi.cl';

        console.log('📥 [MercadoPago] Result recibido:', { status, payment_id, preference_id });

        try {
            // Usar payment_id o preference_id como token
            const token = payment_id || preference_id;

            if (!token) {
                console.error('❌ [MercadoPago] No se recibió token');
                return res.redirect(`${frontendUrl}/mercadopagoprocess/PedidoError?reason=no_token`);
            }

            // Obtener estado del pago
            let statusRes;
            try {
                statusRes = await service.getPaymentStatus(token);
            } catch (err) {
                console.error('❌ [MercadoPago] Error obteniendo estado de pago:', err);
                return res.redirect(`${frontendUrl}/mercadopagoprocess/PedidoError?reason=status_check_failed`);
            }

            if (!statusRes || !statusRes.success) {
                console.error('❌ [MercadoPago] Error en respuesta de getPaymentStatus:', statusRes);
                return res.redirect(`${frontendUrl}/mercadopagoprocess/PedidoError?reason=status_check_failed`);
            }

            const paymentStatus = statusRes?.data?.status || statusRes?.data?.response?.status || status;

            console.log('📊 [MercadoPago] Status del pago:', paymentStatus);

            // Normalizar estado de MP a estados internos
            let normalizedStatus = paymentStatus;
            if (typeof paymentStatus === 'string') {
                const lowerStatus = paymentStatus.toLowerCase();
                if (lowerStatus === 'approved') normalizedStatus = 'AUTHORIZED';
                else if (lowerStatus === 'rejected') normalizedStatus = 'REJECTED';
                else if (lowerStatus === 'pending') normalizedStatus = 'PENDING';
                else if (lowerStatus === 'cancelled' || lowerStatus === 'canceled') normalizedStatus = 'CANCELED';
                else normalizedStatus = paymentStatus.toUpperCase();
            }

            if (normalizedStatus === 'AUTHORIZED') {
                console.log('✅ [MercadoPago] Pago autorizado, redirigiendo...');
                return res.redirect(`${frontendUrl}/mercadopagoprocess?token=${token}`);
            } else {
                console.log('❌ [MercadoPago] Pago no autorizado, redirigiendo a error. Status:', normalizedStatus);
                return res.redirect(`${frontendUrl}/mercadopagoprocess/PedidoError?token=${token}&status=${normalizedStatus || 'UNKNOWN'}`);
            }
        } catch (e) {
            console.error('❌ [MercadoPago] Error en handleResult:', e);
            return res.redirect(`${frontendUrl}/mercadopagoprocess/PedidoError?reason=server_error`);
        }
    };

    // Obtener información completa de una transacción
    getTransactionInfo = async (req, res) => {
        const { token } = req.params;
        console.log(`📥 [MercadoPago] getTransactionInfo token: ${token}`);

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token es requerido',
            });
        }

        try {
            const response = await service.getTransactionInfo(token);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (e) {
            console.error('❌ [MercadoPago] Error en getTransactionInfo:', e);
            return res.status(500).json({
                success: false,
                message: 'Error obteniendo información de transacción',
                error: e?.message || e,
            });
        }
    };

    // Buscar pedido asociado a una transacción
    getOrderByTransactionToken = async (req, res) => {
        const { token } = req.params;
        console.log(`📥 [MercadoPago] getOrderByTransactionToken token: ${token}`);

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token es requerido',
            });
        }

        try {
            const response = await service.getOrderByTransactionToken(token);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (e) {
            console.error('❌ [MercadoPago] Error en getOrderByTransactionToken:', e);
            return res.status(500).json({
                success: false,
                message: 'Error buscando pedido',
                error: e?.message || e,
            });
        }
    };

    // Obtener transacciones pendientes de un usuario
    getPendingTransactions = async (req, res) => {
        const { sessionId } = req.params;
        console.log(`📥 [MercadoPago] getPendingTransactions sessionId: ${sessionId}`);

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'sessionId es requerido',
            });
        }

        try {
            const response = await service.getPendingTransactions(sessionId);
            return res.status(200).json(response);
        } catch (e) {
            console.error('❌ [MercadoPago] Error en getPendingTransactions:', e);
            return res.status(500).json({
                success: false,
                message: 'Error obteniendo transacciones pendientes',
                error: e?.message || e,
            });
        }
    };

    // Vincular un pedido a una transacción (idempotente)
    linkOrder = async (req, res) => {
        try {
            const { token, orderId } = req.body || {};
            if (!token || !orderId) {
                return res.status(400).json({
                    success: false,
                    message: 'token y orderId son requeridos'
                });
            }
            const response = await service.linkOrderToTransaction(token, orderId);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (e) {
            console.error('❌ [MercadoPago] Error en linkOrder:', e);
            return res.status(500).json({
                success: false,
                message: 'Error vinculando pedido a transacción',
                error: e?.message || e
            });
        }
    };

    // Cancelar transacción por el usuario
    cancel = async (req, res) => {
        try {
            const { token, reason } = req.body || {};
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token es requerido para cancelar'
                });
            }
            const response = await service.cancelTransaction(token, reason || 'user_cancelled');
            return res.status(response.success ? 200 : 400).json(response);
        } catch (e) {
            console.error('❌ [MercadoPago] Error en cancel:', e);
            return res.status(500).json({
                success: false,
                message: 'Error cancelando transacción',
                error: e?.message || e
            });
        }
    };
}

