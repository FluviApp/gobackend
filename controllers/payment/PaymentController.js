// src/controllers/payment/PaymentController.js

import PaymentService from '../../services/payment/payment.service.js';

const service = new PaymentService();

export default class PaymentController {
    createTransaction = async (req, res) => {
        console.log('📥 createTransaction request body:', req.body);

        const { amount, buyOrder, sessionId } = req.body;

        if (!amount || !buyOrder || !sessionId) {
            console.warn('⚠️ Datos faltantes en la creación de transacción');
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos: amount, buyOrder, sessionId',
            });
        }

        try {
            const response = await service.createTransaction({ amount, buyOrder, sessionId });

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
}
