import connectMongoDB from '../../libs/mongoose.js';
import Product from '../../models/Product.js';
import Packs from '../../models/Packs.js';
import fs from 'fs';
import path from 'path';

export default class StoreProductsService {
    constructor() {
        connectMongoDB();
    }

    async _groupVariantImages(files) {
        const variantImages = {};
        const uploadDir = path.join(process.cwd(), 'public/uploads/products');
        fs.mkdirSync(uploadDir, { recursive: true });

        for (const [field, fileList] of Object.entries(files || {})) {
            const match = field.match(/^variantImages_(\d+)$/);
            if (!match) continue;

            const index = parseInt(match[1], 10);
            const images = Array.isArray(fileList) ? fileList : [fileList];

            variantImages[index] = [];

            for (const file of images) {
                const fileName = `${Date.now()}_${file.name}`;
                const fullPath = path.join(uploadDir, fileName);
                await file.mv(fullPath); // ← igual que en productos simples
                variantImages[index].push(`/uploads/products/${fileName}`);
            }
        }

        return variantImages;
    }


    getAllProducts = async ({ storeId, categoryId, subcategoryId, page = 1, limit = 10 }) => {
        try {
            console.log('📦 Parámetros recibidos:', { storeId, categoryId, subcategoryId, page, limit });

            if (!storeId) {
                throw new Error('storeId es obligatorio');
            }

            const query = { storeId };

            // Caso 1: sin categoría ni subcategoría → productos sueltos
            if (!categoryId && !subcategoryId) {
                query.$and = [
                    {
                        $or: [
                            { categoryIds: { $exists: false } },
                            { categoryIds: { $eq: [] } },
                            { categoryIds: { $size: 0 } }
                        ]
                    },
                    {
                        $or: [
                            { subcategoryIds: { $exists: false } },
                            { subcategoryIds: { $eq: [] } },
                            { subcategoryIds: { $size: 0 } }
                        ]
                    }
                ];
                console.log('🔍 Filtro: productos sueltos (sin categoría ni subcategoría)');
            }

            // Caso 2: solo categoría
            if (categoryId && !subcategoryId) {
                query.categoryIds = categoryId;
                console.log('🔍 Filtro: productos por categoryId:', categoryId);
            }

            // Caso 3: solo subcategoría
            if (subcategoryId && !categoryId) {
                query.subcategoryIds = subcategoryId;
                console.log('🔍 Filtro: productos por subcategoryId:', subcategoryId);
            }

            // ✅ Caso 4: ambos presentes → producto debe tener ambos IDs
            if (categoryId && subcategoryId) {
                query.categoryIds = categoryId;
                query.subcategoryIds = subcategoryId;
                console.log('🔍 Filtro: productos por categoryId Y subcategoryId:', { categoryId, subcategoryId });
            }

            const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                sort: { createdAt: -1 }
            };

            console.log('📄 Query final construido:', JSON.stringify(query, null, 2));
            console.log('⚙️ Opciones de paginación:', options);

            const result = await Product.paginate(query, options);
            console.log('✅ Productos encontrados:', result.docs.length);

            return {
                success: true,
                message: 'Productos filtrados correctamente',
                data: result
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener productos:', error);
            return {
                success: false,
                message: error.message || 'Error inesperado al obtener productos'
            };
        }
    };

    getAllProductsForSelect = async ({ storeId, search = '', limit = 50 }) => {
        const query = { storeId };

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .lean();

        const packs = await Packs.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .lean();

        const normalizedProducts = products.map(p => ({
            _id: p._id,
            name: p.name,
            priceBase: p.priceBase ?? p.price,
            priceDiscount: p.priceDiscount,
            isPack: false
        }));

        const normalizedPacks = packs.map(p => ({
            _id: p._id,
            name: `${p.name} (Pack)`,
            priceBase: p.price,
            priceDiscount: null,
            isPack: true,
            items: p.products
        }));

        return [...normalizedProducts, ...normalizedPacks];
    };



    getAllProductsUnfiltered = async ({ storeId, search = '', page = 1, limit = 10 }) => {
        try {
            const query = { storeId };

            if (search) {
                query.name = { $regex: new RegExp(search, 'i') }; // Búsqueda por nombre
            }

            const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                sort: { createdAt: -1 },
            };

            const result = await Product.paginate(query, options);

            return {
                success: true,
                message: 'Productos obtenidos correctamente',
                data: result
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener productos sin filtro:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener productos'
            };
        }
    };


    getProductById = async (id) => {
        try {
            const product = await Product.findById(id);

            if (!product) {
                return {
                    success: false,
                    message: 'Producto no encontrado'
                };
            }

            return {
                success: true,
                message: 'Producto obtenido correctamente',
                data: product
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener producto por ID:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener producto'
            };
        }
    };


    getProductsByCategory = async ({ categoryId }) => {
        console.log(categoryId)
        try {
            if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
                throw new Error('categoryId inválido');
            }

            const products = await Product.find({
                categoryIds: mongoose.Types.ObjectId(categoryId)
            }).sort({ createdAt: -1 });

            return {
                success: true,
                message: 'Productos obtenidos por categoría correctamente',
                data: products
            };
        } catch (error) {
            console.error('❌ Servicio - getProductsByCategory:', error);
            return {
                success: false,
                message: error.message || 'Error inesperado al obtener productos por categoría'
            };
        }
    };











    async createSimpleProduct(data) {
        try {
            let imagePaths = [];

            if (data.image) {
                const uploadDir = path.join(process.cwd(), 'public/uploads/products');
                fs.mkdirSync(uploadDir, { recursive: true });

                const imagesArray = Array.isArray(data.image) ? data.image : [data.image];

                for (const file of imagesArray) {
                    const fileName = `${Date.now()}_${file.name}`;
                    const fullPath = path.join(uploadDir, fileName);
                    await file.mv(fullPath);
                    imagePaths.push(`/uploads/products/${fileName}`);
                }
            }

            // 🔄 Convertir correctamente los arrays si vienen como string
            const categoryIds = Array.isArray(data['categoryIds[]'])
                ? data['categoryIds[]']
                : data['categoryIds[]']
                    ? [data['categoryIds[]']]
                    : [];

            const subcategoryIds = Array.isArray(data['subcategoryIds[]'])
                ? data['subcategoryIds[]']
                : data['subcategoryIds[]']
                    ? [data['subcategoryIds[]']]
                    : [];

            const productData = {
                name: data.name.trim(),
                detail: data.detail?.trim() || '',
                priceBase: parseFloat(data.priceBase) || 0,
                priceDiscount: parseFloat(data.priceDiscount) || 0,
                isFeatured: data.isFeatured === 'true',
                available: data.available === 'true',
                images: imagePaths,
                variants: [],
                storeId: data.storeId,
                categoryIds,
                subcategoryIds,
            };

            const product = await Product.create(productData);

            return {
                success: true,
                message: 'Producto creado correctamente',
                data: product
            };
        } catch (error) {
            console.error('❌ Servicio - Error al crear producto:', error);
            return {
                success: false,
                message: 'Error inesperado al crear producto'
            };
        }
    }




    createVariantProduct = async (data, files) => {
        try {
            // 🔄 Parsear variantes si vienen como string
            if (typeof data.variants === 'string') {
                data.variants = JSON.parse(data.variants);
            }

            // 🔄 Agrupar imágenes por variante
            const variantImages = await this._groupVariantImages(files);

            const variants = (data.variants || []).map((variant, i) => ({
                ...variant,
                images: variantImages[i] || [],
            }));

            // 🔄 Convertir categoryIds[] y subcategoryIds[] igual que en createSimpleProduct
            const categoryIds = Array.isArray(data['categoryIds[]'])
                ? data['categoryIds[]']
                : data['categoryIds[]']
                    ? [data['categoryIds[]']]
                    : [];

            const subcategoryIds = Array.isArray(data['subcategoryIds[]'])
                ? data['subcategoryIds[]']
                : data['subcategoryIds[]']
                    ? [data['subcategoryIds[]']]
                    : [];

            const productData = {
                name: data.name?.trim(),
                detail: data.detail?.trim() || '',
                isFeatured: data.isFeatured === 'true',
                available: data.available === 'true',
                images: [],
                variants,
                storeId: data.storeId,
                categoryIds,
                subcategoryIds,
            };

            const product = await Product.create(productData);

            return {
                success: true,
                message: 'Producto con variantes creado correctamente',
                data: product,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al crear producto con variantes:', error);
            return {
                success: false,
                message: 'Error inesperado al crear producto con variantes',
            };
        }
    };




    async updateSimpleProduct(id, data) {
        try {
            const product = await Product.findById(id);
            if (!product) {
                return { success: false, message: 'Producto no encontrado' };
            }

            let updatedImages = product.images || [];

            // 🔴 Manejo de nuevas imágenes sin borrar las existentes
            if (data.image) {
                const uploadDir = path.join(process.cwd(), 'public/uploads/products');
                fs.mkdirSync(uploadDir, { recursive: true });

                const newImages = Array.isArray(data.image) ? data.image : [data.image];
                for (const file of newImages) {
                    const fileName = `${Date.now()}_${file.name}`;
                    const fullPath = path.join(uploadDir, fileName);
                    await file.mv(fullPath);
                    updatedImages.push(`/uploads/products/${fileName}`);
                }
            }

            // 🔥 Eliminar imágenes si el cliente envía una lista explícita
            if (data.removedImages && typeof data.removedImages === 'string') {
                try {
                    const toRemove = JSON.parse(data.removedImages);
                    for (const imgPath of toRemove) {
                        const fullOldPath = path.join(process.cwd(), 'public', imgPath);
                        if (fs.existsSync(fullOldPath)) {
                            fs.unlinkSync(fullOldPath);
                        }
                    }

                    // Filtrar las eliminadas del array final
                    updatedImages = updatedImages.filter(img => !toRemove.includes(img));
                } catch (err) {
                    console.warn('⚠️ Error al procesar removedImages:', err.message);
                }
            }

            const updated = await Product.findByIdAndUpdate(id, {
                name: data.name.trim(),
                detail: data.detail?.trim() || '',
                priceBase: parseFloat(data.priceBase) || 0,
                priceDiscount: parseFloat(data.priceDiscount) || 0,
                isFeatured: data.isFeatured === 'true',
                available: data.available === 'true',
                images: updatedImages,
                variants: [],
                storeId: data.storeId
            }, { new: true });

            return {
                success: true,
                message: 'Producto actualizado correctamente',
                data: updated
            };
        } catch (error) {
            console.error('❌ Servicio - Error al actualizar producto:', error);
            return {
                success: false,
                message: 'Error inesperado al actualizar producto'
            };
        }
    }



    async updateVariantProduct(id, data, files) {
        // 1️⃣ Parsear campos si llegan como string
        if (typeof data.variants === 'string') {
            try {
                data.variants = JSON.parse(data.variants);
            } catch (err) {
                return { success: false, message: 'Formato inválido en variantes' };
            }
        }

        if (typeof data.removedVariantImages === 'string') {
            try {
                data.removedVariantImages = JSON.parse(data.removedVariantImages);
            } catch (err) {
                console.warn('⚠️ No se pudo parsear removedVariantImages:', err.message);
                data.removedVariantImages = {};
            }
        }

        const product = await Product.findById(id);
        if (!product) {
            return { success: false, message: 'Producto no encontrado' };
        }

        // 2️⃣ Log: Confirmar qué llegó desde el frontend
        console.log('📦 Variantes eliminadas recibidas del frontend (removedVariantImages):');
        for (const [variantId, paths] of Object.entries(data.removedVariantImages || {})) {
            console.log(`➡️ Variante ID: ${variantId}`);
            for (const p of paths) {
                console.log(`   🖼️ Imagen a eliminar: ${p}`);
            }
        }

        // 3️⃣ Eliminar físicamente las imágenes
        for (const [variantId, paths] of Object.entries(data.removedVariantImages || {})) {
            for (const relPath of paths) {
                const cleanPath = relPath.replace(/^\/+/, '');
                const fullPath = path.join(process.cwd(), 'public', cleanPath);
                if (fs.existsSync(fullPath)) {
                    try {
                        fs.unlinkSync(fullPath);
                        console.log('🗑️ Imagen de variante eliminada:', fullPath);
                    } catch (err) {
                        console.warn(`⚠️ No se pudo eliminar imagen ${relPath}:`, err.message);
                    }
                } else {
                    console.warn('⚠️ Imagen no encontrada en el disco:', fullPath);
                }
            }
        }

        // 4️⃣ Procesar imágenes nuevas (subidas)
        const variantImages = await this._groupVariantImages(files);

        // 5️⃣ Reconstruir variantes finales con imágenes preservadas + nuevas
        const oldMap = Object.fromEntries(
            product.variants
                .filter(v => v._id)
                .map(v => [v._id.toString(), v])
        );

        const updatedVariants = (data.variants || []).map((variant, i) => {
            const existing = variant._id ? oldMap[variant._id.toString()] : null;
            const preservedImages = existing?.images?.filter(img => {
                // si fue eliminada en removedVariantImages, no se conserva
                const removed = data.removedVariantImages?.[variant._id]?.includes(img);
                return !removed;
            }) || [];

            const newImgs = variantImages[i] || [];

            return {
                ...variant,
                images: [...preservedImages, ...newImgs],
            };
        });


        // 6️⃣ Guardar cambios en Mongo
        const updated = await Product.findByIdAndUpdate(
            id,
            {
                name: data.name?.trim(),
                detail: data.detail?.trim() || '',
                isFeatured: data.isFeatured === 'true',
                available: false,
                images: [],
                variants: updatedVariants,
            },
            { new: true }
        );

        return {
            success: true,
            message: 'Producto con variantes actualizado correctamente',
            data: updated,
        };
    }

    addCategoryToProduct = async (productId, categoryId) => {
        try {
            const updatedProduct = await Product.findByIdAndUpdate(
                productId,
                { $addToSet: { categoryIds: categoryId } }, // evita duplicados
                { new: true }
            );

            if (!updatedProduct) {
                return { success: false, message: 'Producto no encontrado' };
            }

            return {
                success: true,
                message: 'Categoría agregada correctamente al producto',
                data: updatedProduct
            };
        } catch (error) {
            console.error('❌ Servicio - Error al agregar categoría al producto:', error);
            return {
                success: false,
                message: 'Error inesperado al agregar categoría'
            };
        }
    };


    async addSubcategoryToProduct(productId, subcategoryId) {
        try {
            const updated = await Product.findByIdAndUpdate(
                productId,
                { $addToSet: { subcategoryIds: subcategoryId } },
                { new: true }
            );

            if (!updated) {
                return { success: false, message: 'Producto no encontrado' };
            }

            return {
                success: true,
                message: 'Subcategoría agregada correctamente al producto',
                data: updated,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al agregar subcategoría:', error);
            return {
                success: false,
                message: 'Error inesperado al agregar subcategoría',
            };
        }
    }


















    deleteProduct = async (id) => {
        try {
            const deletedProduct = await Product.findByIdAndDelete(id);

            if (!deletedProduct) {
                return {
                    success: false,
                    message: 'Producto no encontrado',
                };
            }

            // 🔥 1. Eliminar imágenes generales del producto
            if (deletedProduct.images && deletedProduct.images.length > 0) {
                for (const img of deletedProduct.images) {
                    const relPath = img.replace(/^\/+/, ''); // Quita "/" inicial
                    const fullPath = path.join(process.cwd(), 'public', relPath);
                    if (fs.existsSync(fullPath)) {
                        try {
                            fs.unlinkSync(fullPath);
                            console.log('🗑 Imagen de producto eliminada:', fullPath);
                        } catch (err) {
                            console.warn('⚠️ No se pudo eliminar imagen:', fullPath, err.message);
                        }
                    } else {
                        console.warn('⚠️ Imagen no encontrada:', fullPath);
                    }
                }
            }

            // 🔥 2. Eliminar imágenes de variantes del producto
            if (deletedProduct.variants && deletedProduct.variants.length > 0) {
                for (const variant of deletedProduct.variants) {
                    for (const img of variant.images || []) {
                        const relPath = img.replace(/^\/+/, ''); // Quita "/" inicial
                        const fullPath = path.join(process.cwd(), 'public', relPath);
                        if (fs.existsSync(fullPath)) {
                            try {
                                fs.unlinkSync(fullPath);
                                console.log('🗑 Imagen de variante eliminada:', fullPath);
                            } catch (err) {
                                console.warn('⚠️ No se pudo eliminar imagen de variante:', fullPath, err.message);
                            }
                        } else {
                            console.warn('⚠️ Imagen de variante no encontrada:', fullPath);
                        }
                    }
                }
            }

            return {
                success: true,
                message: 'Producto eliminado exitosamente',
            };
        } catch (error) {
            console.error('❌ Servicio - Error al eliminar producto:', error);
            return {
                success: false,
                message: 'Error inesperado al eliminar producto',
            };
        }
    };



}
