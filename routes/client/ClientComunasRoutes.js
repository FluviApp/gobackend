import express from 'express';
import ClientComunasController from '../../controllers/client/ClientComunasController.js';

const router = express.Router();
const clientComunasController = new ClientComunasController();

router.get('/comunas', clientComunasController.list);
router.get('/comunas/:slug', clientComunasController.getBySlug);

export default router;
