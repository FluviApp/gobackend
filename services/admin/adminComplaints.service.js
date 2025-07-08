import connectMongoDB from '../../libs/mongoose.js';
import Complaints from '../../models/Complaints.js';

export default class AdminComplaints {
    constructor() {
        connectMongoDB();
    }

    getAllComplaints = async (options = {}) => {
        try {
            const { page = 1, limit = 10 } = options;

            const result = await Complaints.paginate({}, {
                page,
                limit,
                sort: { createdAt: -1 },
            });

            result.docs = result.docs.map(complaint => ({
                sub: complaint._id,
                name: complaint.name,
                mail: complaint.mail,
                phone: complaint.phone,
                complaint: complaint.complaint,
                solved: complaint.solved,
            }));

            return {
                success: true,
                message: 'Reclamos obtenidos correctamente',
                data: result
            };

        } catch (error) {
            console.error('❌ Servicio - error al obtener reclamos:', error);
            throw new Error('No se pudieron obtener los reclamos');
        }
    };

    createComplaint = async (complaintData) => {
        try {
            console.log('🧠 Servicio - creando reclamo con:', complaintData);

            const newComplaint = new Complaints({
                name: complaintData.name,
                mail: complaintData.mail,
                phone: complaintData.phone,
                complaint: complaintData.complaint,
                solved: complaintData.solved || false,
            });

            const savedComplaint = await newComplaint.save();

            return {
                success: true,
                message: 'Reclamo creado correctamente en la base de datos',
                data: savedComplaint.toObject(),
            };

        } catch (error) {
            console.error('❌ Servicio - error al crear reclamo:', error);
            return {
                success: false,
                message: error.message || 'Error inesperado al guardar el reclamo',
            };
        }
    };

    updateComplaint = async (complaintId, updatedData) => {
        try {
            const updatedComplaint = await Complaints.findByIdAndUpdate(
                complaintId,
                {
                    name: updatedData.name,
                    mail: updatedData.mail,
                    phone: updatedData.phone,
                    complaint: updatedData.complaint,
                    solved: updatedData.solved,
                },
                { new: true }
            );

            if (!updatedComplaint) {
                return {
                    success: false,
                    message: 'Reclamo no encontrado'
                };
            }

            return {
                success: true,
                message: 'Reclamo actualizado correctamente',
                data: updatedComplaint.toObject()
            };

        } catch (error) {
            console.error('❌ Servicio - error al actualizar reclamo:', error);
            throw new Error('No se pudo actualizar el reclamo');
        }
    };

    deleteComplaint = async (complaintId) => {
        try {
            const result = await Complaints.deleteOne({ _id: complaintId });

            if (result.deletedCount === 0) {
                return {
                    success: false,
                    message: 'Reclamo no encontrado o ya eliminado'
                };
            }

            return {
                success: true,
                message: 'Reclamo eliminado correctamente'
            };

        } catch (error) {
            console.error('❌ Servicio - error al eliminar reclamo:', error);
            throw new Error('No se pudo eliminar el reclamo');
        }
    };
}
