# Prompt para Cursor: crear proyecto base (esqueleto) desde gobackend

Copia y pega este bloque en Cursor cuando quieras generar un **nuevo proyecto** usando la misma arquitectura y estructura que el gobackend actual.

---

## INSTRUCCIONES PARA CURSOR

Crea un **proyecto base (esqueleto)** de API en Node.js con la siguiente especificación. El objetivo es poder iniciar nuevos proyectos tomando esta estructura y arquitectura como plantilla.

### Requisitos generales

- **Mismo stack**: Node.js, ES modules (`"type": "module"`), Express, MongoDB con Mongoose.
- **Misma estructura de carpetas** que el proyecto de referencia (gobackend).
- **Misma forma de conexión a MongoDB**: usar un módulo en `libs/mongoose.js` que exporte `connectMongoDB`, y que los servicios llamen a `connectMongoDB()` (por ejemplo en el constructor del servicio o al inicio del método que use la BD). La URI debe leerse de **variable de entorno** `MONGO_URI` (no hardcodear credenciales).
- **Un solo dominio/módulo** con **una sola ruta (endpoint)** como ejemplo, para que se vea el flujo completo: **Route → Controller → Service → Model** (y opcionalmente uso de `libs/mongoose.js`).
- Incluir **solo lo mínimo** en dependencias (express, mongoose, dotenv, cors; opcionalmente express-fileupload si quieres mantener la misma base de middleware). El resto (cloudinary, mercadopago, transbank, resend, etc.) no van en el esqueleto.

### Estructura de carpetas a replicar

```
/
├── config/           # Configuración (puede tener un archivo de ejemplo o vacío)
├── controllers/     # Por dominio, ej: controllers/example/
├── libs/            # mongoose.js (conexión MongoDB) y otros libs si aplica
├── models/          # Un modelo de ejemplo (ej: Example o Health)
├── public/          # Carpeta para archivos estáticos (puede incluir public/uploads)
├── routes/          # Por dominio, ej: routes/example/exampleRoutes.js
├── services/        # Por dominio, ej: services/example/example.service.js
├── utils/           # Vacía o un archivo de ejemplo
├── .env.example     # MONGO_URI, PORT, ALLOWED_ORIGINS (opcional)
├── .gitignore
├── package.json     # type: "module", scripts start y dev (nodemon)
└── server.js        # Punto de entrada del servidor
```

### Servidor (server.js)

- Express con:
  - `dotenv.config()`
  - CORS configurado de forma similar: permitir orígenes desde variable de entorno (ej. `ALLOWED_ORIGINS` separada por comas) y `credentials: true`.
  - Middleware: `express.json()`, y opcionalmente `express-fileupload` con `tempFileDir: './tmp'` y `createParentPath: true`.
  - Ruta estática: `app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')))`.
- Montar **solo una ruta** de ejemplo, por ejemplo: `app.use('/api/example', ExampleRoutes)` (o `/api/health` si prefieres un health check).
- Escuchar en `PORT` (env o 5001), en `0.0.0.0`, y mostrar un `console.log` de que el servidor está corriendo.

### Conexión MongoDB (libs/mongoose.js)

- Importar `mongoose`.
- Leer `process.env.MONGO_URI` (obligatorio para el esqueleto; no dejar credenciales en código).
- Exportar una función `connectMongoDB` que:
  - Haga `await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })`.
  - En éxito: `console.log` de conexión correcta.
  - En error: `console.error` y `process.exit(1)`.
- Export: `export default connectMongoDB`.

### Flujo del único endpoint

- **Ruta** (ej. `routes/example/exampleRoutes.js`): Express Router, importar el controlador, instanciarlo, definir **una ruta** (ej. `GET /status` o `GET /`) que delegue en el controlador.
- **Controlador** (ej. `controllers/example/example.controller.js`): Una función que reciba `(req, res)`, llame al servicio correspondiente, y responda con `res.status(...).json(...)` según `success` (ej. 200/400) y en catch 500.
- **Servicio** (ej. `services/example/example.service.js`): Clase que en constructor o en el método que use la BD llame a `connectMongoDB()`, use el **modelo** para una operación simple (ej. `findOne()` o `find().lean()`), y devuelva un objeto `{ success, message, data? }`.
- **Modelo** (ej. `models/Example.js` o `Health.js`): Schema de Mongoose mínimo (ej. un campo `name` o `status` y `timestamps`), exportar el modelo.

Así se cumple el flujo: **Route → Controller → Service → Model**, con la **misma forma de conexión a MongoDB** (libs/mongoose.js y llamada desde el servicio).

### package.json

- `"type": "module"`.
- Scripts: `"start": "node server.js"`, `"dev": "nodemon server.js"`.
- Dependencias: `express`, `mongoose`, `dotenv`, `cors`. Opcional: `express-fileupload`, `nodemon` en devDependencies.

### Resumen

- Mismas carpetas: `config`, `controllers`, `libs`, `models`, `public`, `routes`, `services`, `utils`.
- Mismo servidor: Express, CORS por env, JSON, opcional fileUpload, estáticos, **una sola ruta montada**.
- MongoDB igual: `libs/mongoose.js` con `connectMongoDB` y `MONGO_URI` por env; servicios llaman a `connectMongoDB()` y usan modelos.
- Un solo endpoint de ejemplo que recorra Route → Controller → Service → Model, para usar este proyecto como **esqueleto** para nuevos desarrollos.

---

## FLUJO DE EJEMPLO CON SINTAXIS DE CADA ARCHIVO

El esqueleto debe tener **un solo endpoint**: `GET /api/example/status`. Flujo: **Route → Controller → Service → Model**. Usar exactamente esta sintaxis y convención de nombres.

### 1. server.js

```javascript
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import path from 'path';

import ExampleRoutes from './routes/example/exampleRoutes.js';

dotenv.config();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS bloqueado'), false);
    },
    credentials: true,
}));

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: './tmp',
    createParentPath: true,
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Una sola ruta de ejemplo
app.use('/api/example', ExampleRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
});
```

### 2. libs/mongoose.js

La conexión a MongoDB debe ser idéntica en forma: función `connectMongoDB`, URI por env, mismo `mongoose.connect` y manejo de error.

```javascript
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI no está definida en .env');
    process.exit(1);
}

const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Conectado a MongoDB');
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error.message);
        process.exit(1);
    }
};

export default connectMongoDB;
```

### 3. routes/example/exampleRoutes.js

Misma sintaxis: Router, instancia del controller, método del controller como handler, export default.

```javascript
import express from 'express';
import ExampleController from '../../controllers/example/example.controller.js';

const router = express.Router();
const exampleController = new ExampleController();

router.get('/status', exampleController.getStatus);

export default router;
```

### 4. controllers/example/example.controller.js

Clase con método que llama al servicio y responde con `res.status(...).json(response)`. Respuesta del servicio con `success`, `message` y opcionalmente `data`. En catch, 500.

```javascript
import ExampleService from '../../services/example/example.service.js';

const exampleService = new ExampleService();

export default class ExampleController {
    getStatus = async (req, res) => {
        try {
            const response = await exampleService.getStatus();
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener status:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener status',
            });
        }
    };
}
```

### 5. services/example/example.service.js

Clase que en el constructor llama a `connectMongoDB()`. Método que usa el modelo (ej. `findOne().lean()`), devuelve `{ success, message, data? }`. Misma estructura que el resto del backend.

```javascript
import connectMongoDB from '../../libs/mongoose.js';
import AppConfig from '../../models/AppConfig.js';

export default class ExampleService {
    constructor() {
        connectMongoDB();
    }

    getStatus = async () => {
        try {
            const config = await AppConfig.findOne().lean();

            if (!config) {
                return {
                    success: false,
                    message: 'Configuración no encontrada',
                };
            }

            return {
                success: true,
                message: 'Estado obtenido correctamente',
                data: {
                    status: config.status,
                    appVersion: config.appVersion,
                },
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener status:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener status',
            };
        }
    };
}
```

### 6. models/AppConfig.js

Schema mínimo con timestamps. Misma sintaxis: `Schema`, `mongoose.model`, export default. Nombre de colección opcional como tercer argumento.

```javascript
import mongoose from 'mongoose';

const { Schema } = mongoose;

const appConfigSchema = new Schema(
    {
        status: {
            type: String,
            default: 'active',
            trim: true,
        },
        appVersion: {
            type: String,
            default: '1.0.0',
            trim: true,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

const AppConfig = mongoose.model('AppConfig', appConfigSchema, 'appconfig');

export default AppConfig;
```

### .env.example

```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
PORT=5001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

Al generar el esqueleto, respetar esta sintaxis en cada archivo para que el flujo **GET /api/example/status → Route → Controller → Service → Model (MongoDB)** funcione igual que en el proyecto de referencia.

---

*Generado a partir del análisis del gobackend (estructura, server.js, libs/mongoose.js, flujo ClientAppStatus: routes → controllers → services → models).*
