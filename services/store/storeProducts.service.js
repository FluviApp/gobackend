import connectMongoDB from '../../libs/mongoose.js';
import Product from '../../models/Product.js';
import Packs from '../../models/Packs.js';
import cloudinary from '../../utils/cloudinary.js';
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

        // Debug: verificar datos originales
        if (products.length > 0) {
            console.log('🔍 Primer producto original de BD:', {
                _id: products[0]._id,
                name: products[0].name,
                images: products[0].images,
                variants: products[0].variants?.map(v => ({ images: v.images }))
            });
        }
        if (packs.length > 0) {
            console.log('🔍 Primer pack original de BD:', {
                _id: packs[0]._id,
                name: packs[0].name,
                image: packs[0].image
            });
        }

        const normalizedProducts = products.map(p => {
            // Obtener imagen: primero de images generales, luego de variants[0].images
            let productImage = null;
            let allImages = [];
            
            // Primero intentar con images generales del producto
            if (Array.isArray(p.images) && p.images.length > 0) {
                const validImages = p.images.filter(img => img && String(img).trim() !== '');
                if (validImages.length > 0) {
                    productImage = validImages[0];
                    allImages = validImages;
                }
            }
            
            // Si no hay imágenes generales, buscar en variants
            if (!productImage && Array.isArray(p.variants) && p.variants.length > 0) {
                const firstVariant = p.variants[0];
                if (Array.isArray(firstVariant.images) && firstVariant.images.length > 0) {
                    const validVariantImages = firstVariant.images.filter(img => img && String(img).trim() !== '');
                    if (validVariantImages.length > 0) {
                        productImage = validVariantImages[0];
                        allImages = validVariantImages;
                    }
                }
            }
            
            // Si aún no hay imagen, recopilar todas las imágenes de todas las variantes
            if (allImages.length === 0 && Array.isArray(p.variants)) {
                p.variants.forEach(v => {
                    if (Array.isArray(v.images)) {
                        const validImages = v.images.filter(img => img && String(img).trim() !== '');
                        allImages.push(...validImages);
                    }
                });
                if (allImages.length > 0 && !productImage) {
                    productImage = allImages[0];
                }
            }
            
            const result = {
            _id: p._id,
            name: p.name,
                priceBase: p.priceBase ?? p.price ?? 0,
                priceDiscount: p.priceDiscount ?? 0,
                image: productImage || null,
                images: allImages.length > 0 ? allImages : (productImage ? [productImage] : []),
            isPack: false
            };
            
            // Debug: verificar que se está devolviendo
            if (p._id === products[0]?._id) {
                console.log('🔍 Producto normalizado result:', {
                    _id: result._id,
                    name: result.name,
                    image: result.image,
                    images: result.images,
                    hasImage: !!result.image,
                    hasImages: result.images?.length > 0
                });
            }
            
            return result;
        });

        const normalizedPacks = packs.map(p => {
            const packImage = p.image || null;
            const result = {
            _id: p._id,
            name: `${p.name} (Pack)`,
            priceBase: p.price,
            priceDiscount: null,
                price: p.price,
                image: packImage,
                images: packImage ? [packImage] : [],
            isPack: true,
            items: p.products
            };
            
            // Debug: verificar que se está devolviendo
            if (p._id === packs[0]?._id) {
                console.log('🔍 Pack normalizado result:', {
                    _id: result._id,
                    name: result.name,
                    image: result.image,
                    images: result.images,
                    hasImage: !!result.image,
                    originalImage: p.image
                });
            }
            
            return result;
        });

        // Debug: verificar que las imágenes se están devolviendo
        if (normalizedProducts.length > 0) {
            console.log('🔍 Primer producto normalizado:', {
                _id: normalizedProducts[0]._id,
                name: normalizedProducts[0].name,
                image: normalizedProducts[0].image,
                images: normalizedProducts[0].images,
                hasImage: !!normalizedProducts[0].image,
                hasImages: normalizedProducts[0].images?.length > 0
            });
        }
        if (normalizedPacks.length > 0) {
            console.log('🔍 Primer pack normalizado:', {
                _id: normalizedPacks[0]._id,
                name: normalizedPacks[0].name,
                image: normalizedPacks[0].image,
                images: normalizedPacks[0].images,
                hasImage: !!normalizedPacks[0].image
            });
        }

        const finalResult = [...normalizedProducts, ...normalizedPacks];
        
        // Debug final: verificar el resultado completo
        console.log('🔍 Resultado final - Total items:', finalResult.length);
        console.log('🔍 Primer item del resultado final:', finalResult[0] ? {
            _id: finalResult[0]._id,
            name: finalResult[0].name,
            image: finalResult[0].image,
            images: finalResult[0].images,
            isPack: finalResult[0].isPack
        } : 'No hay items');
        
        return finalResult;
    };



    getAllProductsUnfiltered = async ({ storeId, search = '', page = 1, limit = 50 }) => {
        try {
            const productQuery = { storeId };
            const packQuery = { storeId };

            if (search) {
                productQuery.name = { $regex: new RegExp(search, 'i') };
                packQuery.name = { $regex: new RegExp(search, 'i') };
            }

            // Obtener productos y packs en paralelo
            const [productsResult, packsResult] = await Promise.all([
                Product.find(productQuery).sort({ createdAt: -1 }).limit(parseInt(limit, 10)),
                Packs.find(packQuery).sort({ createdAt: -1 }).limit(parseInt(limit, 10))
            ]);

            console.log('📦 Productos encontrados:', productsResult.length);
            console.log('📦 Packs encontrados:', packsResult.length);
            console.log('📦 StoreId usado:', storeId);
            console.log('📦 Query de productos:', JSON.stringify(productQuery));
            console.log('📦 Query de packs:', JSON.stringify(packQuery));
            
            // Verificar si hay packs en la base de datos para este storeId
            const totalPacks = await Packs.countDocuments({ storeId });
            console.log('📦 Total de packs en BD para este storeId:', totalPacks);
            
            if (packsResult.length > 0) {
                console.log('📦 Primer pack encontrado:', JSON.stringify(packsResult[0].toObject(), null, 2));
            }

            // Combinar productos y packs, marcando packs con un tipo
            const productsArray = productsResult.map(p => {
                const obj = p.toObject();
                return { ...obj, type: 'product' };
            });

            const packsArray = packsResult.map(p => {
                const obj = p.toObject();
                // Asegurar que tenga _id
                if (!obj._id && p._id) {
                    obj._id = p._id.toString();
                }
                return { ...obj, type: 'pack' };
            });
            
            const combined = [...productsArray, ...packsArray];

            console.log('📦 Total combinado:', combined.length);
            console.log('📦 Productos en combined:', productsArray.length);
            console.log('📦 Packs en combined:', packsArray.length);
            
            // Verificar que los packs tengan el campo type
            const packsWithType = combined.filter(p => p.type === 'pack');
            console.log('📦 Packs con type="pack":', packsWithType.length);

            // Ordenar por fecha de creación
            combined.sort((a, b) => new Date(b.createdAt || b.createdAt) - new Date(a.createdAt || a.createdAt));

            return {
                success: true,
                message: 'Productos y packs obtenidos correctamente',
                data: {
                    docs: combined,
                    totalDocs: combined.length,
                    limit: parseInt(limit, 10),
                    page: parseInt(page, 10),
                    totalPages: 1
                }
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
                const imagesArray = Array.isArray(data.image) ? data.image : [data.image];

                for (const file of imagesArray) {
                    const uploadResult = await cloudinary.uploader.upload(
                        file.tempFilePath || file.path,
                        { folder: 'products' }
                    );
                    imagePaths.push(uploadResult.secure_url);
                }
            }

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
                priceMayorista: parseFloat(data.priceMayorista) || 0,
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
            if (typeof data.variants === 'string') {
                data.variants = JSON.parse(data.variants);
            }

            // Agrupamos imágenes por variante
            const variantImages = {};

            for (const [field, fileList] of Object.entries(files || {})) {
                const match = field.match(/^variantImages_(\d+)$/);
                if (!match) continue;

                const index = parseInt(match[1], 10);
                const images = Array.isArray(fileList) ? fileList : [fileList];

                variantImages[index] = [];

                for (const file of images) {
                    const uploadResult = await cloudinary.uploader.upload(
                        file.tempFilePath || file.path,
                        { folder: 'products/variants' }
                    );
                    variantImages[index].push(uploadResult.secure_url);
                }
            }

            // Procesar variantes con imágenes cargadas
            const variants = (data.variants || []).map((variant, i) => ({
                ...variant,
                images: variantImages[i] || [],
            }));

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
                images: [], // en productos con variantes no se usan imágenes generales
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

            let updatedImages = [...product.images];

            // 🔼 Subir nuevas imágenes
            if (data.image) {
                const newImages = Array.isArray(data.image) ? data.image : [data.image];

                for (const file of newImages) {
                    const uploadResult = await cloudinary.uploader.upload(
                        file.tempFilePath || file.path,
                        { folder: 'products' }
                    );
                    updatedImages.push(uploadResult.secure_url);
                }
            }

            // 🔥 Eliminar imágenes marcadas como removidas
            if (data.removedImages && typeof data.removedImages === 'string') {
                try {
                    const toRemove = JSON.parse(data.removedImages);

                    for (const imgUrl of toRemove) {
                        const publicId = this.getPublicIdFromUrl(imgUrl);
                        if (publicId) {
                            await cloudinary.uploader.destroy(publicId);
                            console.log('🗑 Imagen eliminada de Cloudinary:', publicId);
                        }
                    }

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
                priceMayorista: parseFloat(data.priceMayorista) || 0,
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
        try {
            // 1️⃣ Parseo de entradas
            if (typeof data.variants === 'string') {
                data.variants = JSON.parse(data.variants);
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
            if (!product) return { success: false, message: 'Producto no encontrado' };

            // 2️⃣ Agrupar imágenes nuevas por índice de variante
            const variantImages = {};
            for (const [field, fileList] of Object.entries(files || {})) {
                const match = field.match(/^variantImages_(\d+)$/);
                if (!match) continue;

                const index = parseInt(match[1], 10);
                const images = Array.isArray(fileList) ? fileList : [fileList];
                variantImages[index] = [];

                for (const file of images) {
                    const result = await cloudinary.uploader.upload(file.tempFilePath || file.path, {
                        folder: 'products/variants',
                    });
                    variantImages[index].push(result.secure_url);
                }
            }

            // 3️⃣ Reconstrucción de variantes con mezcla: preservadas + nuevas
            const oldMap = Object.fromEntries(
                product.variants
                    .filter(v => v._id)
                    .map(v => [v._id.toString(), v])
            );

            const updatedVariants = (data.variants || []).map((variant, i) => {
                const existing = variant._id ? oldMap[variant._id.toString()] : null;

                const preservedImages = existing?.images?.filter(img => {
                    const markedForRemoval = data.removedVariantImages?.[variant._id]?.includes(img);
                    return !markedForRemoval;
                }) || [];

                // 🔥 Eliminar imágenes marcadas
                const toRemove = data.removedVariantImages?.[variant._id] || [];
                for (const img of toRemove) {
                    const publicId = this.getPublicIdFromUrl(img);
                    if (publicId) {
                        cloudinary.uploader.destroy(publicId).then(() => {
                            console.log('🗑 Imagen de variante eliminada de Cloudinary:', publicId);
                        }).catch(err => {
                            console.warn('⚠️ Error eliminando imagen Cloudinary:', publicId, err.message);
                        });
                    }
                }

                const newImgs = variantImages[i] || [];

                return {
                    ...variant,
                    images: [...preservedImages, ...newImgs],
                };
            });

            // 4️⃣ Actualizar en base de datos
            const updated = await Product.findByIdAndUpdate(
                id,
                {
                    name: data.name?.trim(),
                    detail: data.detail?.trim() || '',
                    isFeatured: data.isFeatured === 'true',
                    available: false,
                    images: [], // en productos con variantes no se usan imágenes generales
                    variants: updatedVariants,
                },
                { new: true }
            );

            return {
                success: true,
                message: 'Producto con variantes actualizado correctamente',
                data: updated,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al actualizar producto con variantes:', error);
            return {
                success: false,
                message: 'Error inesperado al actualizar producto con variantes',
            };
        }
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
            if (deletedProduct.images?.length > 0) {
                for (const img of deletedProduct.images) {
                    const url = typeof img === 'string' ? img : img.url;
                    const publicId = this.getPublicIdFromUrl(url);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                        console.log('🗑 Imagen eliminada de Cloudinary:', publicId);
                    }
                }
            }

            // 🔥 2. Eliminar imágenes de variantes
            if (deletedProduct.variants?.length > 0) {
                for (const variant of deletedProduct.variants) {
                    for (const img of variant.images || []) {
                        const url = typeof img === 'string' ? img : img.url;
                        const publicId = this.getPublicIdFromUrl(url);
                        if (publicId) {
                            await cloudinary.uploader.destroy(publicId);
                            console.log('🗑 Imagen de variante eliminada de Cloudinary:', publicId);
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


    getPublicIdFromUrl = (url) => {
        try {
            const urlObj = new URL(url);
            const parts = urlObj.pathname.split('/');
            const fileWithExt = parts.pop(); // último segmento (ej: "archivo.jpg")
            const [publicId] = fileWithExt.split('.'); // eliminamos extensión
            const folder = parts.pop(); // carpeta (ej: "categories")
            return `${folder}/${publicId}`;
        } catch (err) {
            console.warn('⚠️ Error al extraer public_id de URL:', err.message);
            return null;
        }
    };

}
