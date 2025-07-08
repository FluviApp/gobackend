import connectMongoDB from '../../libs/mongoose.js'
import Stores from '../../models/Stores.js'
import User from '../../models/User.js';
import fs from 'fs';
import path from 'path';

export default class AdminStoresService {
    constructor() {
        connectMongoDB()
    }
    getAllStores = async (options = {}) => {
        try {
            console.log('1')
            const { page = 1, limit = 10 } = options;

            const result = await Stores.paginate({}, {
                page,
                limit,
                sort: { createdAt: -1 },
            });

            // Formatear cada store como hicimos con los users
            result.docs = result.docs.map(store => ({
                sub: store._id,
                name: store.name,
                address: store.address,
                admin: store.admin,
                holiday: store.holiday === 'true' || store.holiday === true,
                paymentmethod: store.paymentmethod,
                schedules: store.schedules,
                phone: store.phone,
                image: store.image,
                availableInMarketplace: store.availableInMarketplace === 'true' || store.availableInMarketplace === true,
            }));


            return {
                success: true,
                message: 'Tiendas obtenidas correctamente',
                data: result
            };

        } catch (error) {
            console.error('❌ Servicio - error al obtener tiendas:', error);
            throw new Error('No se pudieron obtener las tiendas');
        }
    };

    createStore = async (storeData) => {
        try {
            console.log('🧠 Servicio - creando tienda con:', storeData);

            const admin = {
                sub: storeData['admin[sub]'],
                name: storeData['admin[name]'],
                email: storeData['admin[email]'],
            };

            if (!admin.sub || !admin.name || !admin.email) {
                throw new Error('Faltan datos del administrador');
            }

            const existingStore = await Stores.findOne({ name: storeData.name.trim() });
            if (existingStore) {
                const error = new Error('Ya existe una tienda con ese nombre');
                error.statusCode = 400;
                throw error;
            }

            // 🔥 Guardar imagen
            const uploadDir = path.join(process.cwd(), 'public/uploads/stores');
            fs.mkdirSync(uploadDir, { recursive: true });

            const file = storeData.image;
            const extension = path.extname(file.name);
            if (!extension) throw new Error('El archivo no tiene extensión válida');

            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const fileName = `${Date.now()}_${randomSuffix}${extension}`;
            const fullPath = path.join(uploadDir, fileName);

            await file.mv(fullPath);
            const imagePath = `/uploads/stores/${fileName}`;

            // 🔧 Crear tienda
            const newStore = new Stores({
                name: storeData.name,
                address: storeData.address,
                admin,
                holiday: storeData.holiday,
                paymentmethod: storeData.paymentmethod,
                schedules: storeData.schedules,
                phone: storeData.phone,
                availableInMarketplace: storeData.availableInMarketplace === 'true' || storeData.availableInMarketplace === true,
                image: imagePath, // ✅ Aquí asignamos la imagen correctamente
            });

            const savedStore = await newStore.save();

            await User.findByIdAndUpdate(admin.sub, {
                storeId: savedStore._id.toString(),
            });

            return {
                success: true,
                message: 'Tienda creada correctamente en la base de datos',
                data: savedStore.toObject(),
            };
        } catch (error) {
            console.error('❌ Servicio - error al crear tienda:', error);
            return {
                success: false,
                message: error.message || 'Error inesperado al guardar la tienda',
            };
        }
    };





    updateStore = async (storeId, data) => {
        try {
            const existingStore = await Stores.findById(storeId);
            if (!existingStore) {
                return {
                    success: false,
                    message: 'Tienda no encontrada',
                };
            }

            const admin = {
                sub: data['admin[sub]'],
                name: data['admin[name]'],
                email: data['admin[email]'],
            };

            if (!admin.sub || !admin.name || !admin.email) {
                throw new Error('Faltan datos del administrador');
            }

            let updatedImage = existingStore.image;

            if (data.image) {
                const uploadDir = path.join(process.cwd(), 'public/uploads/stores');
                fs.mkdirSync(uploadDir, { recursive: true });

                const file = data.image;
                const extension = path.extname(file.name);
                if (!extension) throw new Error('El archivo no tiene extensión válida');

                const randomSuffix = Math.random().toString(36).substring(2, 8);
                const fileName = `${Date.now()}_${randomSuffix}${extension}`;
                const fullPath = path.join(uploadDir, fileName);

                await file.mv(fullPath);
                updatedImage = `/uploads/stores/${fileName}`;

                const oldPath = path.join(process.cwd(), 'public', existingStore.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            const updatedStore = await Stores.findByIdAndUpdate(
                storeId,
                {
                    name: data.name.trim(),
                    address: data.address.trim(),
                    admin,
                    holiday: data.holiday,
                    paymentmethod: data.paymentmethod,
                    schedules: data.schedules,
                    phone: data.phone.trim(),
                    availableInMarketplace: data.availableInMarketplace === 'true' || data.availableInMarketplace === true,

                    image: updatedImage,
                },
                { new: true }
            );

            if (existingStore.admin?.sub !== admin.sub) {
                await User.findByIdAndUpdate(existingStore.admin.sub, {
                    $unset: { storeId: "" },
                });

                await User.findByIdAndUpdate(admin.sub, {
                    storeId: updatedStore._id.toString(),
                });
            }

            return {
                success: true,
                message: 'Tienda actualizada correctamente',
                data: updatedStore.toObject(),
            };
        } catch (error) {
            console.error('❌ Servicio - error al actualizar tienda:', error);
            return {
                success: false,
                message: error.message || 'No se pudo actualizar la tienda',
            };
        }
    };



    deleteStore = async (storeId) => {
        try {
            const result = await Stores.deleteOne({ _id: storeId });

            if (result.deletedCount === 0) {
                return {
                    success: false,
                    message: 'Tienda no encontrada o ya eliminada'
                };
            }

            return {
                success: true,
                message: 'Tienda eliminada correctamente'
            };

        } catch (error) {
            console.error('❌ Servicio - error al eliminar tienda:', error);
            throw new Error('No se pudo eliminar la tienda');
        }
    };




}
