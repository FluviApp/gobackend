import DeliveryOrdersService from '../../services/delivery/DeliveryOrdersService.js'

const service = new DeliveryOrdersService()

export default class DeliveryOrdersController {
    getOrdersByDeliveryId = async (req, res) => {
        try {
            const { id } = req.params
            const orders = await service.getOrdersByDeliveryId(id)

            return res.status(200).json({
                success: true,
                data: orders,
            })
        } catch (error) {
            console.error('❌ Error en getOrdersByDeliveryId:', error)
            return res.status(500).json({
                success: false,
                message: 'Error al obtener los pedidos del repartidor',
            })
        }
    }

    getActiveOrdersByDeliveryId = async (req, res) => {
        try {
            const { id } = req.params
            const orders = await service.getActiveOrdersByDeliveryId(id)

            return res.status(200).json({
                success: true,
                data: orders,
            })
        } catch (error) {
            console.error('❌ Error en getActiveOrdersByDeliveryId:', error)
            return res.status(500).json({
                success: false,
                message: 'Error al obtener los pedidos activos del repartidor',
            })
        }
    }

    getFinalizedTodayByDeliveryId = async (req, res) => {
        try {
            const { id } = req.params
            const orders = await service.getFinalizedTodayByDeliveryId(id)

            return res.status(200).json({
                success: true,
                data: orders,
            })
        } catch (error) {
            console.error('❌ Error en getFinalizedTodayByDeliveryId:', error)
            return res.status(500).json({
                success: false,
                message: 'Error al obtener los pedidos finalizados hoy',
            })
        }
    }
    updateOrderById = async (req, res) => {
        try {
            const { id } = req.params
            const updateData = req.body

            const updated = await service.updateOrderById(id, updateData)

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado o no se pudo actualizar',
                })
            }

            return res.status(200).json({
                success: true,
                data: updated,
            })
        } catch (error) {
            console.error('❌ Error en updateOrderById:', error)
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar el pedido',
            })
        }
    }


}
