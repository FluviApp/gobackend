import AdminComplaintsService from '../../services/admin/adminComplaints.service.js';
const AdminComplaints = new AdminComplaintsService();

export default class adminComplaintsController {

    getAllComplaints = async (req, res) => {
        try {
            const { page, limit } = req.query;

            const response = await AdminComplaints.getAllComplaints({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
            });

            return res.status(200).json(response);

        } catch (error) {
            console.error('❌ Controller - error al obtener reclamos:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor',
            });
        }
    };

    createComplaint = async (req, res) => {
        try {
            const response = await AdminComplaints.createComplaint(req.body);

            return res.status(200).json(response);

        } catch (error) {
            console.error('❌ Controller - error inesperado al crear reclamo:', error);

            const status = error.statusCode || 500;

            return res.status(status).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor',
            });
        }
    };

    updateComplaint = async (req, res) => {
        try {
            const complaintId = req.params.id;
            const updatedData = req.body;

            const response = await AdminComplaints.updateComplaint(complaintId, updatedData);

            return res.status(response.success ? 200 : 400).json(response);

        } catch (error) {
            console.error('❌ Controller - error al actualizar reclamo:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado al actualizar el reclamo',
            });
        }
    };

    deleteComplaint = async (req, res) => {
        try {
            const complaintId = req.params.id;

            const response = await AdminComplaints.deleteComplaint(complaintId);

            return res.status(response.success ? 200 : 400).json(response);

        } catch (error) {
            console.error('❌ Controller - error al eliminar reclamo:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado al eliminar el reclamo',
            });
        }
    };
}
