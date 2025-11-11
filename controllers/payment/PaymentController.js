// src/controllers/payment/PaymentController.js

import PaymentService from '../../services/payment/payment.service.js';

const service = new PaymentService();

export default class PaymentController {
    createTransaction = async (req, res) => {
        console.log('📥 createTransaction request body:', req.body);

        const { amount, buyOrder, sessionId, payload } = req.body;

        if (!amount || !buyOrder || !sessionId) {
            console.warn('⚠️ Datos faltantes en la creación de transacción');
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos: amount, buyOrder, sessionId',
            });
        }

        try {
            const response = await service.createTransaction({ amount, buyOrder, sessionId, payload });

            if (!response?.data?.token || !response?.data?.url) {
                console.warn('⚠️ Datos incompletos en la respuesta del servicio');
                return res.status(500).json({
                    success: false,
                    message: 'Error al generar datos de pago',
                });
            }

            console.log('✅ createTransaction success:', response);
            return res.status(200).json(response);
        } catch (e) {
            console.error('❌ Error en createTransaction:', e);
            return res.status(500).json({
                success: false,
                message: 'Error creando transacción',
                error: e?.message || e
            });
        }
    };


    commitTransaction = async (req, res) => {
        console.log('📥 commitTransaction body:', req.body);

        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token es requerido para confirmar la transacción',
            });
        }

        try {
            const response = await service.commitTransaction(token);
            console.log('✅ commitTransaction success:', response);
            return res.status(200).json(response);
        } catch (e) {
            console.error('❌ Error en commitTransaction:', e);
            return res.status(500).json({
                success: false,
                message: 'Error confirmando transacción',
                error: e?.message || e,
            });
        }
    };

    getTransactionStatus = async (req, res) => {
        const token = req.params.token;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token es requerido para consultar el estado',
            });
        }

        try {
            const response = await service.getTransactionStatus(token);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (e) {
            console.error('❌ Error en getTransactionStatus:', e);
            return res.status(500).json({
                success: false,
                message: 'Error consultando estado de transacción',
                error: e?.message || e,
            });
        }
    };


    deleteTransaction = async (req, res) => {
        const token = req.params.token;
        console.log(`📥 deleteTransaction token: ${token}`);

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token es requerido para eliminar la transacción',
            });
        }

        try {
            const response = await service.deleteTransaction(token);
            console.log('✅ deleteTransaction result:', response);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (e) {
            console.error('❌ Error en deleteTransaction:', e);
            return res.status(500).json({
                success: false,
                message: 'Error eliminando transacción',
                error: e?.message || e,
            });
        }
    };

    getTransactionHistory = async (req, res) => {
        const { userId, buyOrder } = req.query;
        console.log(`📥 getTransactionHistory query:`, { userId, buyOrder });

        try {
            const response = await service.getTransactionHistory({ userId, buyOrder });
            console.log('✅ getTransactionHistory result:', response);
            return res.status(200).json(response);
        } catch (e) {
            console.error('❌ Error en getTransactionHistory:', e);
            return res.status(500).json({
                success: false,
                message: 'Error listando transacciones',
                error: e?.message || e,
            });
        }
    };

    // Endpoint que reemplaza el HTML estático - recibe la redirección de Webpay
    webpayResult = async (req, res) => {
        const { token_ws, TBK_TOKEN } = req.query;
        const token = token_ws || TBK_TOKEN; // Webpay puede enviar token_ws o TBK_TOKEN

        console.log('📥 webpayResult recibido:', { token_ws, TBK_TOKEN, token });

        if (!token) {
            console.error('❌ No se recibió token de Webpay');
            // Redirigir al frontend con error
            const frontendUrl = process.env.FRONTEND_URL || 'https://fluvi.cl';
            return res.redirect(`${frontendUrl}/webpayprocess/PedidoError?reason=no_token`);
        }

        try {
            // Hacer commit del pago
            console.log('🔄 Haciendo commit del pago con token:', token);
            const commitResult = await service.commitTransaction(token);

            console.log('✅ Commit result:', commitResult);

            const frontendUrl = process.env.FRONTEND_URL || 'https://fluvi.cl';

            // Redirigir al frontend según el resultado
            // El commitResult.data puede tener status directamente o en response.status
            const status = commitResult?.data?.status || commitResult?.data?.response?.status;
            
            if (status === 'AUTHORIZED') {
                // Pago exitoso - redirigir al frontend
                // Redirigimos a /webpayprocess con el token para que el componente maneje la lógica
                console.log('✅ Pago autorizado, redirigiendo a webpayprocess con token');
                return res.redirect(`${frontendUrl}/webpayprocess?token=${token}`);
            } else {
                // Pago rechazado/cancelado - redirigir a error
                console.log('❌ Pago no autorizado, redirigiendo a error. Status:', status);
                return res.redirect(`${frontendUrl}/webpayprocess/PedidoError?token=${token}&status=${status || 'UNKNOWN'}`);
            }
        } catch (e) {
            console.error('❌ Error en webpayResult:', e);
            const frontendUrl = process.env.FRONTEND_URL || 'https://fluvi.cl';
            return res.redirect(`${frontendUrl}/webpayprocess/PedidoError?reason=server_error`);
        }
    };

    // Buscar pedido asociado a una transacción
    getOrderByTransactionToken = async (req, res) => {
        const { token } = req.params;
        console.log(`📥 getOrderByTransactionToken token: ${token}`);

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
            console.error('❌ Error en getOrderByTransactionToken:', e);
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
        console.log(`📥 getPendingTransactions sessionId: ${sessionId}`);

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
            console.error('❌ Error en getPendingTransactions:', e);
            return res.status(500).json({
                success: false,
                message: 'Error obteniendo transacciones pendientes',
                error: e?.message || e,
            });
        }
    };

    // Obtener información completa de una transacción
    getTransactionInfo = async (req, res) => {
        const { token } = req.params;
        console.log(`📥 getTransactionInfo token: ${token}`);

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
            console.error('❌ Error en getTransactionInfo:', e);
            return res.status(500).json({
                success: false,
                message: 'Error obteniendo información de transacción',
                error: e?.message || e,
            });
        }
    };

    // Endpoint para redirigir a Webpay con POST (genera HTML dinámicamente)
    webpayRedirect = async (req, res) => {
        const { token, url } = req.query;
        const frontendUrl = process.env.FRONTEND_URL || 'https://fluvi.cl';

        if (!token || !url) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Error</title>
                </head>
                <body>
                    <h1>Error: Faltan parámetros requeridos</h1>
                    <p>Token y URL son requeridos para redirigir a Webpay.</p>
                </body>
                </html>
            `);
        }

        // Generar HTML que hace POST automáticamente a Webpay
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redirigiendo a Webpay...</title>
                <meta charset="utf-8">
            </head>
            <body>
                <p>Redirigiendo a Webpay...</p>
                <form id="webpayForm" method="POST" action="${url}">
                    <input type="hidden" name="token_ws" value="${token}" />
                </form>
                <script>
                    document.getElementById('webpayForm').submit();
                </script>
            </body>
            </html>
        `;

        res.send(html);
    };
}
