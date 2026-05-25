import express from 'express';
import StoreEmailsController from '../../controllers/store/storeEmailsController.js';

const router = express.Router();
const storeEmailsController = new StoreEmailsController();

router.get('/emails', storeEmailsController.getAllEmails);
router.post('/emails/send', storeEmailsController.sendEmail);
router.post('/emails/send-multiple', storeEmailsController.sendEmailToMultiple);
router.delete('/emails/:id', storeEmailsController.deleteEmail);

export default router;
