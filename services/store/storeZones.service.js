import connectMongoDB from '../../libs/mongoose.js';
import Zones from '../../models/Zones.js';
import Client from '../../models/Clients.js';
import { isPointInPolygon, zonePolygon, buildComunaPolyMap } from '../../libs/geo.js';

export default class StoreZonesService {
    constructor() {
        connectMongoDB();
    }

    // Calcula cuántos clientes quedarían FUERA de toda cobertura si se guarda
    // una zona con el polígono propuesto. Usa la MISMA lógica que valida la app
    // (isPointInPolygon + zonePolygon), por lo que el resultado es fiel al cobro real.
    // - zoneId: zona que se está editando (su polígono se reemplaza por el propuesto).
    //           Si es null/undefined, se trata como zona NUEVA (se agrega).
    // Devuelve solo los clientes que HOY están cubiertos y quedarían afuera (regresión).
    coverageImpact = async ({ storeId, zoneId = null, polygon = [] }) => {
        try {
            if (!storeId) return { success: false, message: 'storeId es obligatorio' };

            const proposedPoly = (Array.isArray(polygon) ? polygon : [])
                .map((p) => ({ lat: Number(p?.lat), lng: Number(p?.lng) }))
                .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
            if (proposedPoly.length < 3) {
                return { success: false, message: 'El polígono propuesto es inválido (mínimo 3 puntos)' };
            }

            const zones = await Zones.find({ storeId }).lean();
            const comunaMap = await buildComunaPolyMap(zones);

            // Polígonos efectivos ACTUALES (como está hoy la cobertura)
            const currentPolys = zones
                .map((z) => zonePolygon(z, comunaMap))
                .filter((p) => Array.isArray(p) && p.length >= 3);

            // Polígonos efectivos PROPUESTOS (reemplazando/añadiendo la zona editada)
            let replaced = false;
            const proposedPolys = zones
                .map((z) => {
                    if (zoneId && String(z._id) === String(zoneId)) { replaced = true; return proposedPoly; }
                    return zonePolygon(z, comunaMap);
                })
                .filter((p) => Array.isArray(p) && p.length >= 3);
            if (!replaced) proposedPolys.push(proposedPoly); // zona nueva

            const inAny = (point, polys) => polys.some((poly) => isPointInPolygon(point, poly));

            const clients = await Client.find(
                { storeId, lat: { $ne: null }, lon: { $ne: null } },
                { name: 1, address: 1, phone: 1, lat: 1, lon: 1 }
            ).lean();

            const newlyUncovered = [];
            let checked = 0;
            for (const c of clients) {
                const lat = Number(c.lat), lng = Number(c.lon);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
                checked++;
                const point = { lat, lng };
                const before = inAny(point, currentPolys);
                const after = inAny(point, proposedPolys);
                if (before && !after) {
                    newlyUncovered.push({
                        _id: c._id,
                        name: c.name || 'Cliente',
                        address: c.address || '',
                        phone: c.phone || '',
                        lat,
                        lon: lng,
                    });
                }
            }

            return {
                success: true,
                message: 'Impacto de cobertura calculado',
                data: {
                    newlyUncoveredCount: newlyUncovered.length,
                    newlyUncovered,
                    checked,
                    totalClients: clients.length,
                },
            };
        } catch (error) {
            console.error('❌ Error al calcular impacto de cobertura:', error);
            return { success: false, message: 'Error al calcular impacto de cobertura' };
        }
    };

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
                        name: data.name || '',
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
