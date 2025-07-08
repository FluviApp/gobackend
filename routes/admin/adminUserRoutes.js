import express from 'express';
import AdminUsersController from '../../controllers/admin/adminUserController.js';

const router = express.Router();

const adminUsersController = new AdminUsersController();
router.get('/users', adminUsersController.getAllUsers)
router.get('/usersAdmin', adminUsersController.getAdminUsers);
router.post('/users', adminUsersController.createUser)
router.put('/users/:id', adminUsersController.updateUser)
router.delete('/users/:id', adminUsersController.deleteUser)


export default router;
