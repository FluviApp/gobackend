import express from 'express'
import DeliveryOrdersController from '../../controllers/delivery/DeliveryOrdersController.js'

const router = express.Router()
const controller = new DeliveryOrdersController()

// Todos los pedidos asignados
router.get('/orders/:id', controller.getOrdersByDeliveryId)
// Solo pedidos activos (NO finalizados, de hoy o anteriores)
router.get('/active-orders/:id', controller.getActiveOrdersByDeliveryId)
//Solo pedidos finalizados hoy
router.get('/finalized-today/:id', controller.getFinalizedTodayByDeliveryId)
//Update del pedido
router.put('/orders/:id', controller.updateOrderById)

export default router
