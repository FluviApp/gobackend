import connectMongoDB from '../../libs/mongoose.js';
import Zones from '../../models/Zones.js';

export default class StoreZonesService {
    constructor() {
        connectMongoDB();
    }

    getAllZones = async ({ storeId, page = 1, limit = 50 }) => {
        try {
            const query = { storeId };
            const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                sort: { createdAt: -1 }
            };

            const result = await Zones.paginate(query, options);

            return {
                success: true,
                message: 'Zonas obtenidas correctamente',
                data: result,
            };
        } catch (error) {
            console.error('❌ Error al obtener zonas:', error);
            return {
                success: false,
                message: 'Error al obtener zonas',
            };
        }
    };

    createZone = async (req, res) => {
        try {
            const { body } = req;

            const generateDefaultSchedule = () => {
                const hours = {};
                for (let h = 10; h <= 18; h++) {
                    const hour = `${h.toString().padStart(2, '0')}:00`;
                    if (hour !== '13:00') {
                        hours[hour] = true;
                    }
                }

                const enabledDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                const schedule = {};

                enabledDays.forEach(day => {
                    schedule[day] = { enabled: true, hours: { ...hours } };
                });

                schedule.saturday = { enabled: false, hours: {} };
                schedule.sunday = { enabled: false, hours: {} };

                return schedule;
            };

            const zoneData = {
                ...body,
                dealerId: body.dealerId || '',
                schedule: body.schedule || generateDefaultSchedule(),
            };


            const newZone = new Zones(zoneData);
            const saved = await newZone.save();

            return res.status(201).json({
                success: true,
                message: 'Zona creada correctamente',
                data: saved,
            });
        } catch (error) {
            console.error('❌ Error al crear zona:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error al crear zona',
            });
        }
    };


    updateZone = async (id, data) => {
        console.log('➡️ Datos recibidos en updateZone:', data);
        try {
            // Limpieza: eliminamos los _id internos de cada punto del polígono
            const cleanPolygon = (data.polygon || []).map(({ lat, lng }) => ({ lat, lng }));

            const updated = await Zones.findByIdAndUpdate(
                id,
                {
                    $set: {
                        type: data.type,
                        comuna: data.comuna,
                        polygon: cleanPolygon,
                        deliveryCost: parseFloat(data.deliveryCost),
                        storeId: data.storeId,
                        dealerId: data.dealerId || '',
                        schedule: data.schedule || {},
                    }

                },
                { new: true }
            );

            if (!updated) {
                return {
                    success: false,
                    message: 'Zona no encontrada',
                };
            }

            return {
                success: true,
                message: 'Zona actualizada correctamente',
                data: updated,
            };
        } catch (error) {
            console.error('❌ Error al actualizar zona:', error);
            return {
                success: false,
                message: 'Error al actualizar zona',
            };
        }
    };




    deleteZone = async (id) => {
        try {
            const deleted = await Zones.findByIdAndDelete(id);

            if (!deleted) {
                return {
                    success: false,
                    message: 'Zona no encontrada',
                };
            }

            return {
                success: true,
                message: 'Zona eliminada correctamente',
            };
        } catch (error) {
            console.error('❌ Error al eliminar zona:', error);
            return {
                success: false,
                message: 'Error al eliminar zona',
            };
        }
    };
}
