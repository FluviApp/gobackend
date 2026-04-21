import express from 'express';
import StoreAnnouncementsController from '../../controllers/store/storeAnnouncementsController.js';

const router = express.Router();
const storeAnnouncementsController = new StoreAnnouncementsController();

router.get('/announcements', storeAnnouncementsController.getAllAnnouncements);
router.post('/announcements', storeAnnouncementsController.createAnnouncement);
router.put('/announcements/:id', storeAnnouncementsController.updateAnnouncement);
router.delete('/announcements/:id', storeAnnouncementsController.deleteAnnouncement);

export default router;
