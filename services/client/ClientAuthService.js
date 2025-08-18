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

    // service
    register = async (data) => {
        try {
            const {
                name,
                email,
                password,
                address,
                block,                 // 👈 ahora lo recibimos
                lat,
                lon,
                phone,
                storeId = 'default',
            } = data;

            const normEmail = (email || '').toLowerCase().trim();

            // Validaciones mínimas (opcional, ajusta a tu gusto)
            if (!normEmail || !password || !address || !storeId) {
                return { success: false, message: 'Faltan campos obligatorios' };
            }

            const exists = await Clients.findOne({ email: normEmail });
            if (exists) {
                return { success: false, message: 'El correo ya está registrado' };
            }

            const newClient = new Clients({
                name: (name || '').trim(),
                email: normEmail,
                password, // ⚠️ considera hashear con bcrypt antes de guardar en producción
                address: (address || '').trim(),
                block: (block ?? '').toString().trim(), // 👈 guardamos block (opcional)
                lat: typeof lat === 'string' ? parseFloat(lat) : lat,
                lon: typeof lon === 'string' ? parseFloat(lon) : lon,
                phone: (phone ?? '').toString().trim(),
                storeId,
            });

            await newClient.save();

            const clientData = newClient.toObject();
            delete clientData.password;

            // ✅ Enviar correo de bienvenida (si corresponde)
            // await sendWelcomeEmail(clientData.email, clientData.name || 'Usuario');

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

            // 🧼 Limpia tokens anteriores
            await PasswordResetToken.deleteMany({ userId: client._id });

            // 💾 Guarda nuevo token
            await PasswordResetToken.create({
                userId: client._id,
                token,
                expiresAt
            });

            // 📩 Enviar correo con el nuevo link apuntando al frontend en Render
            const resetLink = `https://resetpass.onrender.com/reset-password?token=${token}`;
            await sendResetPasswordEmail(client.email, client.name || 'Usuario', resetLink);

            console.log('📩 Enlace de recuperación enviado a:', client.email);

            return {
                success: true,
                message: 'Se ha enviado un enlace de recuperación a tu correo',
            };
        } catch (error) {
            console.error('❌ Error en recoverPassword:', error);
            return {
                success: false,
                message: 'Error al generar el enlace de recuperación',
            };
        }
    };

    resetPassword = async ({ token, newPassword }) => {
        try {
            if (!token || !newPassword) {
                return { success: false, message: 'Token o contraseña faltante' };
            }

            // Buscar el token
            const tokenDoc = await PasswordResetToken.findOne({ token });

            if (!tokenDoc) {
                return { success: false, message: 'Token inválido' };
            }

            if (tokenDoc.used) {
                return { success: false, message: 'Este enlace ya fue utilizado' };
            }

            if (tokenDoc.expiresAt < new Date()) {
                return { success: false, message: 'El token ha expirado' };
            }

            const client = await Clients.findById(tokenDoc.userId);
            if (!client) {
                return { success: false, message: 'Usuario no encontrado' };
            }

            client.password = newPassword;
            await client.save();

            // Marca el token como usado
            tokenDoc.used = true;
            await tokenDoc.save();

            return { success: true, message: 'Contraseña actualizada correctamente' };

        } catch (error) {
            console.error('❌ ClientAuthService - error en resetPassword:', error);
            return { success: false, message: 'Error al actualizar contraseña' };
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
