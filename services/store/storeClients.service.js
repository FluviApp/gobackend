import connectMongoDB from '../../libs/mongoose.js';
import Client from '../../models/Clients.js';

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
}
