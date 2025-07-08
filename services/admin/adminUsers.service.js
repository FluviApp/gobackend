import connectMongoDB from '../../libs/mongoose.js'
import User from '../../models/User.js'

export default class AdminUserService {
    constructor() {
        connectMongoDB()
    }

    getAllUsers = async (options = {}) => {
        try {
            const { page = 1, limit = 10 } = options

            const result = await User.paginate({}, {
                page,
                limit,
                sort: { createdAt: -1 },
            })

            // Transformar cada user para que venga listo para frontend
            result.docs = result.docs.map(user => ({
                sub: user._id,
                name: user.name,
                email: user.mail,
                password: user.password,
                role: user.role,
            }))

            return {
                success: true,
                message: 'Usuarios obtenidos correctamente',
                data: result
            }

        } catch (error) {
            console.error('❌ Servicio - error al obtener usuarios:', error)
            throw new Error('No se pudieron obtener los usuarios')
        }
    }

    getAdminUsers = async () => {
        console.log('get admins')
        return await User.find({ role: 'admin' });
    };

    createUser = async (userData) => {
        try {
            console.log('🧠 Servicio - creando usuario con:', userData)

            // Verificar si el correo ya existe
            const existingUser = await User.findOne({ mail: userData.email.toLowerCase() })
            if (existingUser) {
                const error = new Error('Ya existe un usuario con ese correo electrónico')
                error.statusCode = 400
                throw error
            }

            const newUser = new User({
                name: userData.nombre,
                password: userData.clave,
                mail: userData.email.toLowerCase(),
                role: userData.rol.toLowerCase()
            })

            const savedUser = await newUser.save()

            const userToReturn = savedUser.toObject()
            delete userToReturn.password

            return {
                success: true,
                message: 'Usuario creado correctamente en la base de datos',
                data: userToReturn
            }

        } catch (error) {
            console.error('❌ Servicio - error inesperado:', error)
            return {
                success: false,
                message: error.message || 'Error inesperado al guardar el usuario'
            }
        }
    }

    updateUser = async (userId, updatedData) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    name: updatedData.nombre,
                    mail: updatedData.email.toLowerCase(),
                    role: updatedData.rol.toLowerCase(),
                    // Solo actualizamos clave si se proporciona
                    ...(updatedData.clave && { password: updatedData.clave })
                },
                { new: true } // Devuelve el usuario actualizado
            )

            if (!updatedUser) {
                return {
                    success: false,
                    message: 'Usuario no encontrado'
                }
            }

            const userToReturn = updatedUser.toObject()
            delete userToReturn.password

            return {
                success: true,
                message: 'Usuario actualizado correctamente',
                data: userToReturn
            }

        } catch (error) {
            console.error('❌ Servicio - error al actualizar usuario:', error)
            throw new Error('No se pudo actualizar el usuario')
        }
    }

    deleteUser = async (userId) => {
        try {
            const deletedUser = await User.findByIdAndDelete(userId)

            if (!deletedUser) {
                // Usuario no encontrado (pero esto no debería pasar en el primer intento)
                return {
                    success: false,
                    message: 'Usuario no encontrado o ya eliminado'
                }
            }

            return {
                success: true,
                message: 'Usuario eliminado correctamente'
            }

        } catch (error) {
            console.error('❌ Servicio - error al eliminar usuario:', error)
            // Lanzamos para que el controller capture y responda bien
            throw new Error('No se pudo eliminar el usuario')
        }
    }


}
