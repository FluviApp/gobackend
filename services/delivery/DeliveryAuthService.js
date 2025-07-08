import connectMongoDB from '../../libs/mongoose.js';
import Dealers from '../../models/Dealers.js'; // Este es tu modelo compartido
import { sendPasswordRecoveryEmail } from '../../utils/sendRecoveryEmail.js';
import { sendWelcomeEmail } from '../../utils/welcomeTemplate.js';

export default class DeliveryAuthService {
    constructor() {
        connectMongoDB();
    }

    login = async ({ mail, password }) => {
        console.log(mail)
        try {
            const dealer = await Dealers.findOne({ mail: mail.toLowerCase().trim() });

            if (!dealer) {
                return { success: false, message: 'Correo no registrado' };
            }

            if (dealer.password !== password) {
                return { success: false, message: 'Contraseña incorrecta' };
            }

            const dealerData = dealer.toObject();
            delete dealerData.password;

            console.log('🧠 Repartidor logueado:', dealerData);

            return {
                success: true,
                message: 'Inicio de sesión exitoso',
                data: dealerData,
            };
        } catch (error) {
            console.error('❌ DeliveryAuthService - error en login:', error);
            return { success: false, message: 'Error inesperado al iniciar sesión' };
        }
    };

    register = async (data) => {
        try {
            const {
                name,
                mail,
                password,
                storeId,
                zoneId = '',
            } = data;

            const exists = await Dealers.findOne({ mail: mail.toLowerCase().trim() });

            if (exists) {
                return { success: false, message: 'El correo ya está registrado' };
            }

            const newDealer = new Dealers({
                name,
                mail: mail.toLowerCase().trim(),
                password,
                storeId,
                zoneId,
            });

            await newDealer.save();

            const dealerData = newDealer.toObject();
            delete dealerData.password;

            //await sendWelcomeEmail(dealerData.mail, dealerData.name || 'Usuario');

            console.log('🧠 Repartidor registrado:', dealerData);

            return {
                success: true,
                message: 'Registro exitoso',
                data: dealerData,
            };
        } catch (error) {
            console.error('❌ DeliveryAuthService - error en register:', error);
            return { success: false, message: 'Error al registrar repartidor' };
        }
    };

    recoverPassword = async ({ mail }) => {
        try {
            const dealer = await Dealers.findOne({ mail: mail.toLowerCase().trim() });

            if (!dealer) {
                return { success: false, message: 'Correo no registrado' };
            }

            const tempPassword = Math.random().toString(36).slice(-8);
            dealer.password = tempPassword;
            await dealer.save();

            //await sendPasswordRecoveryEmail(dealer.mail, dealer.name || 'Usuario', tempPassword);

            console.log('📩 Correo de recuperación enviado a:', dealer.mail);

            return {
                success: true,
                message: 'Correo de recuperación enviado',
            };
        } catch (error) {
            console.error('❌ DeliveryAuthService - error en recoverPassword:', error);
            return {
                success: false,
                message: 'Error al intentar recuperar la contraseña',
            };
        }
    };

    getDeliveryById = async (id) => {
        try {
            const dealer = await Dealers.findById(id).select('-password');
            return dealer;
        } catch (error) {
            console.error('❌ DeliveryAuthService - error en getDeliveryById:', error);
            return null;
        }
    };

    updateDelivery = async (id, updateData) => {
        try {
            if ('password' in updateData) {
                delete updateData.password;
            }

            const updatedDealer = await Dealers.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
            }).select('-password');

            return updatedDealer;
        } catch (error) {
            console.error('❌ DeliveryAuthService - error en updateDelivery:', error);
            return null;
        }
    };
}
