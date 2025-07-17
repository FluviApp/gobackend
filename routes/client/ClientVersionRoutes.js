import express from 'express';
import ClientVersionController from '../../controllers/client/ClientVersionController.js';

const router = express.Router();
const clientVersionController = new ClientVersionController();

router.get('/version', clientVersionController.getAppVersion);

export default router;
