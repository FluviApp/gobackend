import express from 'express';
import ClientAnnouncementsController from '../../controllers/client/ClientAnnouncementsController.js';

const router = express.Router();
const clientAnnouncementsController = new ClientAnnouncementsController();

router.get('/active', clientAnnouncementsController.getActiveAnnouncements);

export default router;
