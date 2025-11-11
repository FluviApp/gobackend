import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import path from 'path';

//ADMIN
import AdminUserRoutes from './routes/admin/adminUserRoutes.js';
import AdminStoresRoutes from './routes/admin/adminStoresRoutes.js';
import AdminComplaintsRoutes from './routes/admin/adminComplaintsRoutes.js';
import AdminCommerceRoutes from './routes/admin/adminCommerceRoutes.js';

//STORES
import StoreAuthRoutes from './routes/store/storeAuthRoutes.js';
import StoreClientsRoutes from './routes/store/storeClientsRoute.js';
import StoreCategoriesRoutes from './routes/store/storeCategoriesRoute.js';
import StoreSubcategoriesRoutes from './routes/store/storeSubcategoriesRoutes.js';
import StoreProductsRoutes from './routes/store/storeProductsRoute.js';
import StoreDealersRoutes from './routes/store/storeDealersRoute.js';
import StoreZonesRoutes from './routes/store/storeZonesRoute.js';
import StoreOrdersRoutes from './routes/store/storeOrdersRoute.js';
import StoreBannersRoutes from './routes/store/storeBannersRoute.js';
import StoreNotificationsRoutes from './routes/store/storeNotificationsRoute.js';
import StorePacksRoutes from './routes/store/storePacksRoute.js';
import StoreDiscountCodesRoutes from './routes/store/storeDiscountCodesRoute.js';
import StoreInfoRoutes from './routes/store/storeInfo.routes.js';
import StoreTransfersRoutes from './routes/store/storeTransfers.routes.js';
import StoreMetricsRoutes from './routes/store/storeMetricsRoutes.js'; // 📊 NUEVO

//CLIENTE
import ClientAppStatusRoutes from './routes/client/ClientAppStatusRoutes.js';
import ClientVersionRoutes from './routes/client/ClientVersionRoutes.js';
import ClientAuthRoutes from './routes/client/ClientAuthRoutes.js';
import ClientProductsRoutes from './routes/client/ClientProductsRoute.js';
import ClientHomeRoutes from './routes/client/ClientHomeRoutes.js';
import ClientSubcategoriesRoutes from './routes/client/ClientSubcategoriesRoute.js';
import ClientOrderRoutes from './routes/client/ClientOrderRoutes.js';
import ClientNotificationRoutes from './routes/client/ClientNotificationRoutes.js';
import ClientPacksRoutes from './routes/client/ClientPacksRoutes.js';
import ClientZonesRoutes from './routes/client/ClientZonesRoutes.js';
import PaymentRoutes from './routes/payment/PaymentRoutes.js'
import MercadoPagoRoutes from './routes/payment/mercadopago.routes.js'

//Delivery
import DeliveryAuthRoutes from './routes/delivery/DeliveryAuthRoutes.js'
import DeliveryOrdersRoutes from './routes/delivery/DeliveryOrdersRoutes.js'
import DeliveryAppStatusRoutes from './routes/delivery/DeliveryAppStatusRoutes.js';

dotenv.config();

const app = express();

// Middleware CORS
// app.use(cors());
//PERMISO PARA CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // permite Postman/curl
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS bloqueado'), false);
    },
    credentials: true, // <- clave si usas cookies/session
}));

// Middleware de subida de archivos (DEBE ir antes de express.json())
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: './tmp',
    createParentPath: true // crea carpetas si no existen
}));

// Middleware para JSON
app.use(express.json());

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Rutas del admin
app.use('/api/admin', AdminUserRoutes);
app.use('/api/admin', AdminStoresRoutes);
app.use('/api/admin', AdminComplaintsRoutes);
app.use('/api/admin', AdminCommerceRoutes);

// Rutas del store
app.use('/api/store', StoreAuthRoutes);
app.use('/api/store', StoreClientsRoutes);
app.use('/api/store', StoreCategoriesRoutes);
app.use('/api/store', StoreSubcategoriesRoutes);
app.use('/api/store', StoreProductsRoutes);
app.use('/api/store', StoreDealersRoutes);
app.use('/api/store', StoreZonesRoutes);
app.use('/api/store', StoreOrdersRoutes);
app.use('/api/store', StoreBannersRoutes);
app.use('/api/store', StoreNotificationsRoutes);
app.use('/api/store', StorePacksRoutes);
app.use('/api/store', StoreDiscountCodesRoutes);
app.use('/api/store', StoreInfoRoutes);
app.use('/api/store', StoreTransfersRoutes);
app.use('/api/store/metrics', StoreMetricsRoutes); // 📊 NUEVO


// Rutas del cliente
app.use('/api/client', ClientAppStatusRoutes);
app.use('/api/client', ClientVersionRoutes);
app.use('/api/client', ClientAuthRoutes);
app.use('/api/client', ClientProductsRoutes);
app.use('/api/client', ClientHomeRoutes);
app.use('/api/client', ClientZonesRoutes);
app.use('/api/client/subcategories', ClientSubcategoriesRoutes);
app.use('/api/client/orders', ClientOrderRoutes);
app.use('/api/client/notifications', ClientNotificationRoutes);
app.use('/api/client/packs', ClientPacksRoutes);
app.use('/api/payment/webpay', PaymentRoutes); // Rutas de Webpay
app.use('/api/payment/mercadopago', MercadoPagoRoutes); // Rutas de Mercado Pago


//Rutas delivery
app.use('/api/delivery', DeliveryAppStatusRoutes);
app.use('/api/delivery', DeliveryAuthRoutes);
app.use('/api/delivery', DeliveryOrdersRoutes)

// Iniciar servidor
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
});
