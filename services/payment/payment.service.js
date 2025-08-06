import connectMongoDB from '../../libs/mongoose.js';
import PaymentTransaction from '../../models/PaymentTransaction.js';
import Order from '../../models/Order.js';
import pkg from 'transbank-sdk';

const {
    WebpayPlus,
    IntegrationCommerceCodes,
    IntegrationApiKeys
} = pkg;

export default class PaymentService {
    constructor() {
        connectMongoDB();
        this.returnUrl = 'https://fluvi.cl/webpay-result.html';


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
            await PaymentTransaction.create({
                token: trx.token,
                buyOrder,
                sessionId,
                amount,
                status: 'CREATED',
                payload
            });

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

            // ✅ Si fue exitoso, crea el pedido directamente
            if (result.status === 'AUTHORIZED' && trx?.payload) {
                console.log('🛒 Creando pedido automáticamente desde backend...');
                try {
                    const res = await Order.create(trx.payload); // Asegúrate que esté importado
                    console.log('✅ Pedido creado desde backend:', res);
                } catch (err) {
                    console.error('❌ Error al crear el pedido desde backend:', err);
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
            const trx = await PaymentTransaction.findOneAndUpdate(
                { token },
                { status: realStatus.status, response: realStatus },
                { new: true }
            );

            // ✅ Si no existía en Mongo, igual responde
            const responseData = trx || {
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
            console.error('❌ Error al consultar estado desde Transbank:', err);
            return {
                success: false,
                message: 'Error al obtener estado de transacción desde Transbank',
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
}
