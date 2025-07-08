import express from 'express';
import AdminComplaintsController from '../../controllers/admin/adminComplaintsController.js';

const router = express.Router();
const adminComplaintsController = new AdminComplaintsController();

router.get('/complaints', adminComplaintsController.getAllComplaints);
router.post('/complaints', adminComplaintsController.createComplaint);
router.put('/complaints/:id', adminComplaintsController.updateComplaint);
router.delete('/complaints/:id', adminComplaintsController.deleteComplaint);

export default router;

