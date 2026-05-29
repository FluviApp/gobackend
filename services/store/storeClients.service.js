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
        maxSpent = null
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
                {
                    $match: {
                        ...(registrationDateFrom && { createdAt: { $gte: new Date(registrationDateFrom) } }),
                        ...(registrationDateTo && {
                            createdAt: registrationDateTo
                                ? { ...(registrationDateFrom ? { $gte: new Date(registrationDateFrom) } : {}), $lte: new Date(registrationDateTo) }
                                : undefined
                        }),
                    },
                },

                // Stage 4: Hacer lookup con Orders para obtener datos de compras
                {
                    $lookup: {
                        from: 'orders',
                        let: { clientId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$customer.id', '$$clientId'] },
                                    storeId: storeId,
                                    status: { $in: ['entregado', 'confirmado'] } // Solo órdenes completadas/confirmadas
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    totalSpent: { $sum: '$totalPrice' },
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

                // Stage 6: Filtrar por inactividad (último pedido)
                ...(inactivityDays !== null ? [{
                    $match: {
                        $expr: {
                            $lt: [
                                { $ifNull: ['$orders.lastOrderDate', new Date(0)] },
                                new Date(Date.now() - inactivityDays * 24 * 60 * 60 * 1000)
                            ]
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
