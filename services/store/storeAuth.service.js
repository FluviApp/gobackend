import connectMongoDB from '../../libs/mongoose.js'
import User from '../../models/User.js'
import Commerce from '../../models/Commerce.js';

export default class StoreAuthService {
    constructor() {
        connectMongoDB()
    }

    login = async (credentials) => {
        try {
            const { mail, password } = credentials;

            const commerce = await User.findOne({ mail: mail.toLowerCase().trim() });

            if (!commerce) {
                return { success: false, message: 'Correo no registrado' };
            }

            if (commerce.password !== password) {
                return { success: false, message: 'Contraseña incorrecta' };
            }

            const commerceToReturn = commerce.toObject();

            delete commerceToReturn.password;

            // ✅ Asegurate de que storeId esté incluido
            console.log('🧠 Usuario logueado:', commerceToReturn); // 👈 Verifica si tiene storeId

            return {
                success: true,
                message: 'Inicio de sesión exitoso',
                data: commerceToReturn
            };

        } catch (error) {
            console.error('❌ Servicio - error en login:', error);
            return {
                success: false,
                message: 'Error inesperado al intentar iniciar sesión',
            };
        }
    };



    checkCommerceStatus = async (email) => {
        try {
            // Buscar UN comercio activo solamente
            const activeCommerce = await Commerce.findOne({ active: true });

            // Si no hay un comercio activo => servicio suspendido
            if (!activeCommerce) {
                return {
                    success: false,
                    message: 'Comercio suspendido por falta de pago',
                };
            }

            // Si hay un comercio activo => servicio funcionando
            return {
                success: true,
                message: 'Comercio activo',
            };

        } catch (error) {
            console.error('❌ Servicio - error en checkCommerceStatus:', error);
            return {
                success: false,
                message: 'Error inesperado al verificar estado del comercio',
            };
        }
    };



}
