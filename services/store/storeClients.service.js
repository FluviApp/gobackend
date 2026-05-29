import connectMongoDB from '../../libs/mongoose.js';
import Client from '../../models/Clients.js';
import Orders from '../../models/Orders.js';

export default class StoreClientsService {
    constructor() {
        connectMongoDB();
    }

    getAllClients = async ({ storeId, page = 1, limit = 10 }) => {
        try {
            const query = { storeId };
            const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                sort: { createdAt: -1 },
            };

            const result = await Client.paginate(query, options);

            return {
                success: true,
                message: 'Clientes paginados correctamente',
                data: result,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener clientes:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener clientes',
            };
        }
    };


    createClient = async (clientData) => {
        try {
            console.log('🧠 Servicio - creando cliente con:', clientData);

            // Verificar si el correo ya existe
            const existingClient = await Client.findOne({ email: clientData.email.toLowerCase() });
            if (existingClient) {
                const error = new Error('Ya existe un cliente con ese correo electrónico');
                error.statusCode = 400;
                throw error;
            }

            const newClient = new Client({
                name: clientData.name.trim(),
                email: clientData.email.toLowerCase().trim(),
                password: clientData.password.trim(),
                address: clientData.address?.trim() || '',
                phone: clientData.phone?.trim() || '',
                block: clientData.block?.trim() || '',
                lat: clientData.lat || null,
                lon: clientData.lon || null,
                verified: clientData.verified || false,
                token: clientData.token || '',
                device: clientData.device?.trim() || '',
                version: clientData.version?.trim() || '',
                storeId: clientData.storeId,
            });


            const savedClient = await newClient.save();

            const clientToReturn = savedClient.toObject();
            delete clientToReturn.password; // Opcional: no enviar password

            return {
                success: true,
                message: 'Cliente creado correctamente en la base de datos',
                data: clientToReturn
            };

        } catch (error) {
            console.error('❌ Servicio - error inesperado:', error);
            return {
                success: false,
                message: error.message || 'Error inesperado al guardar el cliente'
            };
        }
    }




    updateClient = async (id, clientData) => {
        try {
            const updatedClient = await Client.findByIdAndUpdate(id, clientData, { new: true });

            if (!updatedClient) {
                return {
                    success: false,
                    message: 'Cliente no encontrado',
                };
            }

            return {
                success: true,
                message: 'Cliente actualizado correctamente',
                data: updatedClient,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al actualizar cliente:', error);
            return {
                success: false,
                message: 'Error inesperado al actualizar cliente',
            };
        }
    };

    deleteClient = async (id) => {
        try {
            const deletedClient = await Client.findByIdAndDelete(id);

            if (!deletedClient) {
                return {
                    success: false,
                    message: 'Cliente no encontrado',
                };
            }

            return {
                success: true,
                message: 'Cliente eliminado exitosamente',
            };
        } catch (error) {
            console.error('❌ Servicio - Error al eliminar cliente:', error);
            return {
                success: false,
                message: 'Error inesperado al eliminar cliente',
            };
        }
    };

    getFilteredClients = async ({
        storeId,
        zones = [],
        inactivityDays = null,
        registrationDateFrom = null,
        registrationDateTo = null,
        minSpent = null,
        maxSpent = null,
        neverPurchased = false
    }) => {
        try {
            if (!storeId) {
                return {
                    success: false,
                    message: 'storeId es obligatorio',
                };
            }

            // Construir pipeline de agregación
            const pipeline = [
                // Stage 1: Filtrar por storeId
                { $match: { storeId } },

                // Stage 2: Filtrar por zona (block)
                ...(zones && zones.length > 0 ? [{ $match: { block: { $in: zones } } }] : []),

                // Stage 3: Filtrar por fecha de registro
                ...(registrationDateFrom || registrationDateTo ? [{
                    $match: {
                        ...(registrationDateFrom && { createdAt: { $gte: new Date(registrationDateFrom) } }),
                        ...(registrationDateTo && { createdAt: { $lte: new Date(registrationDateTo) } })
                    }
                }] : []),

                // Stage 4: Hacer lookup con Orders para obtener datos de compras
                {
                    $lookup: {
                        from: 'order', // ⚠️ La colección real es 'order' (singular), ver Orders.js
                        let: { clientId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$customer.id', '$$clientId'] },
                                    storeId: storeId,
                                    status: { $ne: 'cancelado' } // Cualquier pedido no cancelado
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    totalSpent: { $sum: { $ifNull: ['$finalPrice', '$price'] } },
                                    lastOrderDate: { $max: '$createdAt' },
                                    orderCount: { $sum: 1 }
                                }
                            }
                        ],
                        as: 'orders'
                    }
                },

                // Stage 5: Descomponer el array de órdenes
                {
                    $unwind: {
                        path: '$orders',
                        preserveNullAndEmptyArrays: true
                    }
                },

                // Stage 6a: Solo clientes que NUNCA han comprado (filtro aparte)
                ...(neverPurchased ? [{
                    $match: { orders: { $exists: false } }
                }] : []),

                // Stage 6b: Filtrar por inactividad — solo clientes CON historial
                // de compra cuyo último pedido es anterior al corte. Los que nunca
                // compraron se excluyen aquí (tienen su propio filtro).
                ...(inactivityDays !== null && !neverPurchased ? [{
                    $match: {
                        'orders.lastOrderDate': {
                            $exists: true,
                            $lt: new Date(Date.now() - inactivityDays * 24 * 60 * 60 * 1000)
                        }
                    }
                }] : []),

                // Stage 7: Filtrar por monto gastado
                ...(minSpent !== null || maxSpent !== null ? [{
                    $match: {
                        $expr: {
                            $and: [
                                minSpent !== null ? { $gte: [{ $ifNull: ['$orders.totalSpent', 0] }, minSpent] } : true,
                                maxSpent !== null ? { $lte: [{ $ifNull: ['$orders.totalSpent', 0] }, maxSpent] } : true,
                            ]
                        }
                    }
                }] : []),

                // Stage 8: Proyectar campos importantes
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        phone: 1,
                        address: 1,
                        block: 1,
                        createdAt: 1,
                        totalSpent: { $ifNull: ['$orders.totalSpent', 0] },
                        lastOrderDate: '$orders.lastOrderDate',
                        orderCount: { $ifNull: ['$orders.orderCount', 0] }
                    }
                },

                // Stage 9: Ordenar
                { $sort: { createdAt: -1 } }
            ];

            const clients = await Client.aggregate(pipeline).exec();
            console.log(`✅ Filtro clientes — storeId: ${storeId}, inactividad: ${inactivityDays}d, nuncaCompraron: ${neverPurchased}, zonas: ${zones.length}, encontrados: ${clients.length}`);

            return {
                success: true,
                message: `Se encontraron ${clients.length} clientes que cumplen los criterios`,
                data: clients,
            };
        } catch (error) {
            console.error('❌ Servicio - Error al filtrar clientes:', error);
            return {
                success: false,
                message: 'Error al filtrar clientes',
            };
        }
    };
}
