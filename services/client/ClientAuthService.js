import crypto from 'crypto';
import connectMongoDB from '../../libs/mongoose.js';
import Clients from '../../models/Clients.js';
import PasswordResetToken from '../../models/PasswordResetToken.js';
import { sendPasswordRecoveryEmail } from '../../utils/sendRecoveryEmail.js';
import { sendResetPasswordEmail } from '../../utils/sendResetPasswordEmail.js';
import { sendWelcomeEmail } from '../../utils/welcomeTemplate.js';

export default class ClientAuthService {
    constructor() {
        connectMongoDB();
    }

    login = async (credentials) => {
        try {
            const { email, password } = credentials;

            const client = await Clients.findOne({ email: email.toLowerCase().trim() });

            if (!client) {
                return { success: false, message: 'Correo no registrado' };
            }

            if (client.password !== password) { // Reemplaza esto por bcrypt si es necesario
                return { success: false, message: 'Contraseña incorrecta' };
            }

            const clientData = client.toObject();
            delete clientData.password; // No enviamos la contraseña al frontend

            console.log('🧠 Cliente logueado:', clientData);

            return {
                success: true,
                message: 'Inicio de sesión exitoso',
                data: clientData,
            };

        } catch (error) {
            console.error('❌ ClientAuthService - error en login:', error);
            return { success: false, message: 'Error inesperado al intentar iniciar sesión' };
        }
    };

    register = async (data) => {
        try {
            const {
                name,
                email,
                password,
                address,
                lat,
                lon,
                phone,
                storeId = 'default',
            } = data;

            const exists = await Clients.findOne({ email: email.toLowerCase().trim() });

            if (exists) {
                return { success: false, message: 'El correo ya está registrado' };
            }

            const newClient = new Clients({
                name,
                email: email.toLowerCase().trim(),
                password,
                address,
                lat,
                lon,
                phone,
                storeId,
            });

            await newClient.save();

            const clientData = newClient.toObject();
            delete clientData.password;

            // ✅ Enviar correo de bienvenida
            //await sendWelcomeEmail(clientData.email, clientData.name || 'Usuario');

            console.log('🧠 Cliente registrado:', clientData);

            return {
                success: true,
                message: 'Registro exitoso',
                data: clientData,
            };
        } catch (error) {
            console.error('❌ ClientAuthService - error en register:', error);
            return { success: false, message: 'Error al registrar cliente' };
        }
    };

    recoverPassword = async ({ email }) => {
        try {
            const client = await Clients.findOne({ email: email.toLowerCase().trim() });

            if (!client) {
                return { success: false, message: 'Correo no registrado' };
            }

            // 🧪 Generar token seguro (hex aleatorio)
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

            // 🧼 Limpia tokens anteriores (opcional pero recomendable)
            await PasswordResetToken.deleteMany({ userId: client._id });

            // 💾 Guarda nuevo token
            await PasswordResetToken.create({
                userId: client._id,
                token,
                expiresAt
            });

            // 📩 Enviar correo
            const resetLink = `https://fluvi-reset.onrender.com/reset-password?token=${token}`;
            await sendResetPasswordEmail(client.email, client.name || 'Usuario', resetLink);

            console.log('📩 Enlace de recuperación enviado a:', client.email);

            return {
                success: true,
                message: 'Se ha enviado un enlace de recuperación a tu correo',
            };
        } catch (error) {
            console.error('❌ Error en createPasswordResetToken:', error);
            return {
                success: false,
                message: 'Error al generar el enlace de recuperación',
            };
        }
    };


    getClientById = async (id) => {
        try {
            const client = await Clients.findById(id).select('-password');
            return client;
        } catch (error) {
            console.error('❌ ClientAuthService - error en getClientById:', error);
            return null;
        }
    };

    getClientByEmail = async (email) => {
        try {
            const client = await Clients.findOne({ email: email.toLowerCase().trim() }).select('-password');
            return client;
        } catch (error) {
            console.error('❌ ClientAuthService - error en getClientByEmail:', error);
            return null;
        }
    };


    updateClient = async (id, updateData) => {
        try {
            // No permitas cambiar directamente el password desde aquí (a menos que lo manejes intencionadamente)
            if ('password' in updateData) {
                delete updateData.password;
            }

            const updatedClient = await Clients.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
            }).select('-password'); // excluye el password

            return updatedClient;
        } catch (error) {
            console.error('❌ ClientAuthService - error en updateClient:', error);
            return null;
        }
    };


}
