import express from 'express';
import ClientHomeController from '../../controllers/client/ClientHomeController.js';

const router = express.Router();
const clientHomeController = new ClientHomeController();

router.get('/home', clientHomeController.getHomeData);

export default router;
