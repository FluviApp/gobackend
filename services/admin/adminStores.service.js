import connectMongoDB from '../../libs/mongoose.js'
import Stores from '../../models/Stores.js'
import User from '../../models/User.js';
import cloudinary from '../../utils/cloudinary.js';
import { generateUniqueStoreCode } from '../../utils/storeCode.js';
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

            // 🔥 Subir imagen a Cloudinary (persistente; el disco de Render es efímero)
            const file = storeData.image;
            const uploadResult = await cloudinary.uploader.upload(file.tempFilePath || file.path, {
                folder: 'stores',
            });
            const imagePath = uploadResult.secure_url;
            console.log('📷 Imagen de tienda subida a Cloudinary:', imagePath);

            // 🔑 Código único de tienda (nombre + sufijo) para el ingreso por código/QR
            const code = await generateUniqueStoreCode(storeData.name, Stores);

            // 🔧 Crear tienda
            const newStore = new Stores({
                name: storeData.name,
                code,
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
                // Subir nueva imagen a Cloudinary
                const file = data.image;
                const uploadResult = await cloudinary.uploader.upload(file.tempFilePath || file.path, {
                    folder: 'stores',
                });
                updatedImage = uploadResult.secure_url;

                // Borrar la anterior de Cloudinary si corresponde
                if (existingStore.image && existingStore.image.includes('res.cloudinary.com')) {
                    try {
                        const parts = existingStore.image.split('/');
                        const fileWithExt = parts[parts.length - 1];
                        const publicId = `${parts[parts.length - 2]}/${fileWithExt.split('.')[0]}`;
                        await cloudinary.uploader.destroy(publicId);
                    } catch (e) { /* noop */ }
                }
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
