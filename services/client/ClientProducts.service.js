import connectMongoDB from '../../libs/mongoose.js';
import mongoose from 'mongoose';
import Product from '../../models/Product.js';

export default class ClientProductsService {
    constructor() {
        connectMongoDB();
    }

    searchStoreProducts = async ({
        storeId,
        q = '',
        page = 1,
        limit = 20,
        categoryId,
        subcategoryId,
        priceMin,
        priceMax,
        available,
        sort = 'relevance'
    }) => {
        try {
            const and = [{ storeId: String(storeId) }];

            // Filtros
            if (typeof available === 'boolean') {
                and.push({ available });
            }
            if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
                and.push({ categoryIds: new mongoose.Types.ObjectId(categoryId) });
            }
            if (subcategoryId && mongoose.Types.ObjectId.isValid(subcategoryId)) {
                and.push({ subcategoryIds: new mongoose.Types.ObjectId(subcategoryId) });
            }
            if (priceMin != null || priceMax != null) {
                const priceFilter = {};
                if (priceMin != null) priceFilter.$gte = Number(priceMin);
                if (priceMax != null) priceFilter.$lte = Number(priceMax);
                // considerar precio efectivo: priceDiscount si >0, si no priceBase
                // para simplicidad del filtro, aplicamos sobre priceBase (y orden calculado en client)
                and.push({ priceBase: priceFilter });
            }

            const query = and.length ? { $and: and } : {};

            // Construir sort
            const sortMap = {
                relevance: { score: { $meta: 'textScore' } },
                price_asc: { priceBase: 1 },
                price_desc: { priceBase: -1 },
                newest: { createdAt: -1 },
            };
            let sortStage = sortMap[sort] || sortMap.relevance;

            // Paginación
            const pageNum = Math.max(1, parseInt(page, 10) || 1);
            const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 20, 50));
            const skipNum = (pageNum - 1) * limitNum;

            // Búsqueda por texto
            let findQuery = Product.find(query);
            let projection = {
                name: 1,
                detail: 1,
                priceBase: 1,
                priceDiscount: 1,
                images: { $slice: 1 },
                available: 1,
                variants: 1,
                categoryIds: 1,
                subcategoryIds: 1,
                createdAt: 1,
            };

            const term = (q || '').trim();
            const useText = term.length >= 2;
            console.log('🔎 [ClientProductsService.search] built query base:', JSON.stringify(query));
            console.log('🔎 [ClientProductsService.search] term:', term, 'useText:', useText, 'sort:', sort);
            if (useText) {
                // $text con score de relevancia
                findQuery = Product.find({
                    ...query,
                    $text: { $search: term }
                });
                // Solo proyectar score cuando realmente ordenamos por relevancia
                if (sortStage?.score) {
                    projection = { ...projection, score: { $meta: 'textScore' } };
                }
            } else if (term.length === 1) {
                // fallback para términos muy cortos (regex case-insensitive)
                findQuery = Product.find({
                    ...query,
                    name: { $regex: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
                });
            }

            // Si no usamos $text, asegurarnos de no ordenar por score
            if (!useText && sortStage?.score) {
                sortStage = { createdAt: -1 };
            }

            // Ejecutar consultas en paralelo: total + items, con manejo de errores por índice de texto
            let total = 0;
            let items = [];
            try {
                [total, items] = await Promise.all([
                    Product.countDocuments(findQuery.getQuery()),
                    findQuery
                        .select(projection)
                        .sort(sortStage)
                        .skip(skipNum)
                        .limit(limitNum)
                        .lean()
                ]);
                console.log('📊 [ClientProductsService.search] primary results:', { total, count: items.length });
            } catch (err) {
                // Si falla por falta de índice de texto u otro error relacionado, caer a regex
                const msg = err?.message || '';
                const isTextIndexIssue = useText && /text index/i.test(msg);
                console.warn('⚠️ [ClientProductsService.search] primary query failed:', msg);
                if (isTextIndexIssue) {
                    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(safe, 'i');
                    const fallbackQuery = {
                        ...query,
                        $or: [{ name: regex }, { detail: regex }],
                    };
                    console.log('🛟 [ClientProductsService.search] fallback regex due to index issue. Query:', JSON.stringify(fallbackQuery));
                    // Proyección sin textScore para fallback
                    const projectionNoScore = (() => {
                        const p = { ...projection };
                        delete p.score;
                        return p;
                    })();
                    const res = await Promise.all([
                        Product.countDocuments(fallbackQuery),
                        Product.find(fallbackQuery)
                            .select(projectionNoScore)
                            .sort(sort === 'newest' ? { createdAt: -1 } : { name: 1 })
                            .skip(skipNum)
                            .limit(limitNum)
                            .lean(),
                    ]);
                    total = res[0];
                    items = res[1];
                    console.log('📊 [ClientProductsService.search] fallback results (index issue):', { total, count: items.length });
                } else {
                    throw err;
                }
            }

            // Fallback: si no hay resultados y usamos $text, intentar regex por nombre y detalle
            if (useText && total === 0) {
                const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(safe, 'i');
                const fallbackQuery = {
                    ...query,
                    $or: [{ name: regex }, { detail: regex }],
                };
                console.log('🛟 [ClientProductsService.search] fallback regex query:', JSON.stringify(fallbackQuery));
                // Proyección sin textScore para fallback
                const projectionNoScore = (() => {
                    const p = { ...projection };
                    delete p.score;
                    return p;
                })();
                const [fbTotal, fbItems] = await Promise.all([
                    Product.countDocuments(fallbackQuery),
                    Product.find(fallbackQuery)
                        .select(projectionNoScore)
                        .sort(sort === 'newest' ? { createdAt: -1 } : { name: 1 })
                        .skip(skipNum)
                        .limit(limitNum)
                        .lean(),
                ]);
                console.log('📊 [ClientProductsService.search] fallback results:', { total: fbTotal, count: fbItems.length });
                return {
                    success: true,
                    message: 'Productos encontrados',
                    data: {
                        items: fbItems,
                        total: fbTotal,
                        page: pageNum,
                        limit: limitNum,
                        hasMore: skipNum + fbItems.length < fbTotal,
                    }
                };
            }

            return {
                success: true,
                message: 'Productos encontrados',
                data: {
                    items,
                    total,
                    page: pageNum,
                    limit: limitNum,
                    hasMore: skipNum + items.length < total,
                }
            };
        } catch (error) {
            console.error('❌ Servicio - Error en búsqueda de productos:', error);
            return {
                success: false,
                message: 'Error inesperado al buscar productos'
            };
        }
    };

    getProductById = async (id) => {
        try {
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('ID de producto inválido');
            }

            const product = await Product.findById(id);

            if (!product) {
                return {
                    success: false,
                    message: 'Producto no encontrado'
                };
            }

            return {
                success: true,
                message: 'Producto encontrado',
                data: product
            };
        } catch (error) {
            console.error('❌ Servicio - getProductById:', error);
            return {
                success: false,
                message: error.message || 'Error inesperado al obtener producto por ID'
            };
        }
    };

    getProductsByCategory = async (categoryId) => {
        try {

            if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
                throw new Error('categoryId inválido');
            }

            const products = await Product.find({
                categoryIds: new mongoose.Types.ObjectId(categoryId)
            }).sort({ createdAt: -1 });

            return {
                success: true,
                message: 'Productos filtrados por categoría correctamente',
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
    getProductsBySubcategory = async (subcategoryId) => {
        try {


            if (!subcategoryId || !mongoose.Types.ObjectId.isValid(subcategoryId)) {
                throw new Error('subcategoryId inválido');
            }

            const products = await Product.find({
                subcategoryIds: new mongoose.Types.ObjectId(subcategoryId)
            }).sort({ createdAt: -1 });

            return {
                success: true,
                message: 'Productos filtrados por subcategoría correctamente',
                data: products
            };
        } catch (error) {
            console.error('❌ Servicio - getProductsBySubcategory:', error);
            return {
                success: false,
                message: error.message || 'Error inesperado al obtener productos por subcategoría'
            };
        }
    };



}

