import connectMongoDB from '../../libs/mongoose.js';
import Commerce from '../../models/Commerce.js';

export default class AdminCommerceService {
    constructor() {
        connectMongoDB();
    }

    login = async (credentials) => {
        try {
            const { mail, password } = credentials;

            // Buscar comercio por mail
            const commerce = await Commerce.findOne({ mail: mail.toLowerCase().trim() });

            if (!commerce) {
                return {
                    success: false,
                    message: 'Correo no registrado',
                };
            }

            if (commerce.password !== password) {
                return {
                    success: false,
                    message: 'Contraseña incorrecta',
                };
            }

            // Si está todo OK, no retornamos la contraseña
            const commerceToReturn = commerce.toObject();
            delete commerceToReturn.password;

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

    getCommerceById = async (id) => {
        try {
            const commerce = await Commerce.findById(id).lean();

            if (!commerce) {
                return {
                    success: false,
                    message: 'Comercio no encontrado',
                };
            }

            // Podemos devolver solo algunos campos si queremos proteger datos sensibles
            const { _id, active, name, mail, phone, logo, social } = commerce;

            return {
                success: true,
                message: 'Comercio encontrado',
                data: {
                    _id,
                    active,
                    name,
                    mail,
                    phone,
                    logo,
                    social,
                }
            };
        } catch (error) {
            console.error('❌ Servicio - error al obtener comercio por ID:', error);
            return {
                success: false,
                message: 'Error al obtener el comercio',
            };
        }
    };


    getAllCommerces = async (options = {}) => {
        try {
            const { page = 1, limit = 10 } = options;

            console.log('📥 Obteniendo comercios...');
            console.log('🔧 Paginación:', { page, limit });

            const result = await Commerce.paginate({}, {
                page,
                limit,
                sort: { createdAt: -1 },
            });

            console.log('📦 Comercios crudos desde Mongo:', result.docs);

            result.docs = result.docs.map(commerce => ({
                sub: commerce._id,
                active: commerce.active,
                amount: commerce.amount,
                name: commerce.name,
                mail: commerce.mail,
                password: commerce.password,
                phone: commerce.phone,
                logo: commerce.logo,
                social: commerce.social,
            }));

            console.log('✅ Comercios adaptados:', result.docs);

            return {
                success: true,
                message: 'Comercios obtenidos correctamente',
                data: result
            };

        } catch (error) {
            console.error('❌ Servicio - error al obtener comercios:', error);
            throw new Error('No se pudieron obtener los comercios');
        }
    };


    createCommerce = async (commerceData) => {
        try {
            console.log('🧠 Servicio - creando comercio con:', commerceData);

            const existingCommerce = await Commerce.findOne({ mail: commerceData.mail.trim().toLowerCase() });
            if (existingCommerce) {
                const error = new Error('Ya existe un comercio con ese correo electrónico');
                error.statusCode = 400;
                throw error;
            }

            const newCommerce = new Commerce({
                active: commerceData.active ?? true,
                amount: commerceData.amount,
                name: commerceData.name,
                mail: commerceData.mail.trim().toLowerCase(),
                password: commerceData.password,
                phone: commerceData.phone,
                logo: commerceData.logo,
                social: commerceData.social || {},
            });

            const savedCommerce = await newCommerce.save();

            return {
                success: true,
                message: 'Comercio creado correctamente en la base de datos',
                data: savedCommerce.toObject(),
            };

        } catch (error) {
            console.error('❌ Servicio - error al crear comercio:', error);
            return {
                success: false,
                message: error.message || 'Error inesperado al guardar el comercio',
            };
        }
    };

    updateCommerce = async (commerceId, updatedData) => {
        try {
            const updatedCommerce = await Commerce.findByIdAndUpdate(
                commerceId,
                {
                    active: updatedData.active,
                    amount: updatedData.amount,
                    name: updatedData.name,
                    mail: updatedData.mail,
                    password: updatedData.password,
                    phone: updatedData.phone,
                    logo: updatedData.logo,
                    social: updatedData.social,
                },
                { new: true }
            );

            if (!updatedCommerce) {
                return {
                    success: false,
                    message: 'Comercio no encontrado'
                };
            }

            return {
                success: true,
                message: 'Comercio actualizado correctamente',
                data: updatedCommerce.toObject()
            };

        } catch (error) {
            console.error('❌ Servicio - error al actualizar comercio:', error);
            throw new Error('No se pudo actualizar el comercio');
        }
    };

    deleteCommerce = async (commerceId) => {
        try {
            const result = await Commerce.deleteOne({ _id: commerceId });

            if (result.deletedCount === 0) {
                return {
                    success: false,
                    message: 'Comercio no encontrado o ya eliminado'
                };
            }

            return {
                success: true,
                message: 'Comercio eliminado correctamente'
            };

        } catch (error) {
            console.error('❌ Servicio - error al eliminar comercio:', error);
            throw new Error('No se pudo eliminar el comercio');
        }
    };
}
