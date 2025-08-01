import fs from 'fs';
import path from 'path';
import cloudinary from '../../utils/cloudinary.js';
import Packs from '../../models/Packs.js';
import connectMongoDB from '../../libs/mongoose.js';

export default class StorePacksService {
    constructor() {
        connectMongoDB();
    }

    async getAllPacks({ storeId }) {
        try {
            const packs = await Packs.find({ storeId }).sort({ createdAt: -1 });
            return {
                success: true,
                message: 'Packs obtenidos correctamente',
                data: packs,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener packs:', error);
            return {
                success: false,
                message: 'Error al obtener packs',
            };
        }
    }



    async createPack(data, files) {
        try {
            // 📤 Subida a Cloudinary
            let packImageUrl = '';
            if (files?.image) {
                const result = await cloudinary.uploader.upload(
                    files.image.tempFilePath || files.image.path,
                    { folder: 'packs' }
                );
                packImageUrl = result.secure_url;
                console.log('📷 Imagen subida a Cloudinary:', packImageUrl);
            }

            // 🧠 Parsear productos
            const parsedProducts = JSON.parse(data.products || '[]');

            // ✅ Crear pack
            const newPack = await Packs.create({
                storeId: data.storeId,
                name: data.name.trim(),
                price: parseFloat(data.price),
                image: packImageUrl,
                products: parsedProducts.map((p) => ({
                    productId: p.productId,
                    name: p.name,
                    quantity: p.quantity,
                    price: p.price,
                    productImage: p.productImage, // se asume que el frontend envía una URL válida
                })),
            });

            return {
                success: true,
                message: 'Pack creado correctamente',
                data: newPack,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al crear pack:', error);
            return {
                success: false,
                message: 'Error al crear pack',
            };
        }
    }




    async updatePack(id, data, files) {
        try {
            const pack = await Packs.findById(id);
            if (!pack) return { success: false, message: 'Pack no encontrado' };

            let updatedImage = pack.image;

            // 📤 Subir nueva imagen si viene
            if (files?.image) {
                const result = await cloudinary.uploader.upload(
                    files.image.tempFilePath || files.image.path,
                    { folder: 'packs' }
                );
                updatedImage = result.secure_url;

                // 🔥 Eliminar imagen anterior de Cloudinary si era de ahí
                if (pack.image && pack.image.includes('res.cloudinary.com')) {
                    const publicId = this.getPublicIdFromUrl(pack.image);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                        console.log('🗑 Imagen anterior eliminada de Cloudinary:', publicId);
                    }
                }
            }

            // 🧠 Parsear productos
            const parsedProducts = JSON.parse(data.products || '[]');

            const updated = await Packs.findByIdAndUpdate(
                id,
                {
                    name: data.name?.trim(),
                    price: parseFloat(data.price),
                    image: updatedImage,
                    products: parsedProducts.map(p => ({
                        productId: p.productId,
                        name: p.name,
                        quantity: p.quantity,
                        price: p.price,
                        productImage: p.productImage,
                    })),
                },
                { new: true }
            );

            return {
                success: true,
                message: 'Pack actualizado correctamente',
                data: updated,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al actualizar pack:', error);
            return {
                success: false,
                message: 'Error al actualizar pack',
            };
        }
    }


    async deletePack(id) {
        try {
            const deleted = await Packs.findByIdAndDelete(id);
            if (!deleted) return { success: false, message: 'Pack no encontrado' };

            // 🗑 Eliminar imagen de Cloudinary si corresponde
            if (deleted.image && deleted.image.includes('res.cloudinary.com')) {
                const publicId = this.getPublicIdFromUrl(deleted.image);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                    console.log('🗑 Imagen del pack eliminada de Cloudinary:', publicId);
                }
            }

            return {
                success: true,
                message: 'Pack eliminado correctamente',
            };
        } catch (error) {
            console.error('❌ Servicio - Error al eliminar pack:', error);
            return {
                success: false,
                message: 'Error al eliminar pack',
            };
        }
    }

    getPublicIdFromUrl = (url) => {
        try {
            const parts = url.split('/');
            const fileWithExtension = parts.pop();
            const [publicId] = fileWithExtension.split('.');
            const folder = parts.pop();
            return `${folder}/${publicId}`;
        } catch {
            return null;
        }
    };
}
