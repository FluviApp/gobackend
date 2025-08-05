import connectMongoDB from '../../libs/mongoose.js';
import PaymentTransaction from '../../models/PaymentTransaction.js';

import pkg from 'transbank-sdk';

const {
    WebpayPlus,
    IntegrationCommerceCodes,
    IntegrationApiKeys
} = pkg;

export default class PaymentService {
    constructor() {
        connectMongoDB();
        this.returnUrl = 'https://fluvi.cl/payment-result.html';

        // Creamos la instancia de transacción configurada para integración
        this.transaction = WebpayPlus.Transaction.buildForIntegration(
            IntegrationCommerceCodes.WEBPAY_PLUS,
            IntegrationApiKeys.WEBPAY
        );
    }

    createTransaction = async ({ amount, buyOrder, sessionId }) => {
        console.log('📥 Creando transacción con:', { amount, buyOrder, sessionId });

        const trx = await this.transaction.create(
            buyOrder,
            sessionId,
            amount,
            this.returnUrl
        );

        console.log('🔁 Respuesta de Transbank.create():', trx);

        if (!trx?.token || !trx?.url) {
            console.error('❌ Transbank no retornó token o url');
            throw new Error('Error al iniciar transacción con Transbank');
        }

        await PaymentTransaction.create({
            token: trx.token,
            buyOrder,
            sessionId,
            amount,
            status: 'CREATED'
        });

        return {
            success: true,
            message: 'Transacción iniciada',
            data: {
                token: trx.token,
                url: trx.url
            }
        };
    };


    commitTransaction = async (token) => {
        const result = await this.transaction.commit(token);

        const trx = await PaymentTransaction.findOneAndUpdate(
            { token },
            { status: result.status, response: result },
            { new: true }
        );

        return {
            success: true,
            message: 'Transacción confirmada',
            data: trx
        };
    };

    getTransactionStatus = async (token) => {
        const trx = await PaymentTransaction.findOne({ token });
        if (!trx) {
            return { success: false, message: 'Transacción no encontrada' };
        }

        return {
            success: true,
            message: 'Estado de transacción obtenido',
            data: trx
        };
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
}
