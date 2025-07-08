import AdminUserService from '../../services/admin/adminUsers.service.js'
const AdminUsers = new AdminUserService()

export default class AdminUsersController {
    getAllUsers = async (req, res) => {
        try {
            const { page, limit } = req.query

            const response = await AdminUsers.getAllUsers({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            })

            return res.status(200).json(response)

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor'
            })
        }
    }

    getAdminUsers = async (req, res) => {
        console.log('getAdminUsers 1')
        try {
            const admins = await AdminUsers.getAdminUsers();
            res.status(200).json(admins);
        } catch (error) {
            console.error('Error fetching admin users:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };

    createUser = async (req, res) => {
        try {
            const response = await AdminUsers.createUser(req.body)

            return res.status(200).json(response)

        } catch (error) {
            console.error('❌ Controller - error inesperado:', error)

            const status = error.statusCode || 500

            return res.status(status).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor'
            })
        }
    }

    updateUser = async (req, res) => {
        try {
            const userId = req.params.id
            const updatedData = req.body

            const response = await AdminUsers.updateUser(userId, updatedData)

            return res.status(response.success ? 200 : 400).json(response)

        } catch (error) {
            console.error('❌ Controller - error al actualizar usuario:', error)

            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado al actualizar el usuario'
            })
        }
    }


    deleteUser = async (req, res) => {
        try {
            const userId = req.params.id
            const response = await AdminUsers.deleteUser(userId)

            if (response?.success) {
                return res.status(200).json(response)
            } else {
                return res.status(400).json(response || {
                    success: false,
                    message: 'No se pudo eliminar el usuario'
                })
            }

        } catch (error) {
            console.error('❌ Controller - error al eliminar usuario:', error)

            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado al eliminar el usuario'
            })
        }
    }



}
