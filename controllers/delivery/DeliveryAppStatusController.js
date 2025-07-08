import DeliveryAppStatusService from '../../services/delivery/DeliveryAppStatusService.js';

const service = new DeliveryAppStatusService();

export default class DeliveryAppStatusController {
    getStatus = async (req, res) => {
        try {
            const result = await service.getStatus();
            return res.status(200).json(result);
        } catch (error) {
            console.error('❌ DeliveryAppStatusController - error en getStatus:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener el estado de la app del repartidor',
            });
        }
    };
}
