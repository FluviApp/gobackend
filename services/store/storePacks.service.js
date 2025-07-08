import fs from 'fs';
import path from 'path';
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
            // 📁 Crear carpeta si no existe
            const uploadDir = path.join(process.cwd(), 'public/uploads/packs');
            fs.mkdirSync(uploadDir, { recursive: true });

            // 🖼️ Imagen principal del pack
            const file = files.image;
            const extension = path.extname(file.name);
            if (!extension) throw new Error('La imagen no tiene extensión válida');
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${extension}`;
            const fullPath = path.join(uploadDir, fileName);
            await file.mv(fullPath);
            const packImageUrl = `/uploads/packs/${fileName}`;

            // 🧠 Parsear productos (viene como JSON string en req.body.products)
            const parsedProducts = JSON.parse(data.products || '[]');

            // ✅ Crear el pack
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
                    productImage: p.productImage, // Ya viene con URL desde el cliente
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

            // 📤 Si se sube una nueva imagen
            if (files?.image) {
                const uploadDir = path.join(process.cwd(), 'public/uploads/packs');
                fs.mkdirSync(uploadDir, { recursive: true });

                const file = files.image;
                const extension = path.extname(file.name);
                if (!extension) throw new Error('La imagen no tiene extensión válida');

                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${extension}`;
                const fullPath = path.join(uploadDir, fileName);
                await file.mv(fullPath);

                updatedImage = `/uploads/packs/${fileName}`;

                // 🧹 Eliminar la imagen anterior
                const oldPath = path.join(process.cwd(), 'public', pack.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
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
}
