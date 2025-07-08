import StoreZonesService from '../../services/store/storeZones.service.js';
import Zones from '../../models/Zones.js';

const service = new StoreZonesService();

export default class StoreZonesController {
    getAllZones = async (req, res) => {
        try {
            const { storeId, page = 1, limit = 50 } = req.query;
            const response = await service.getAllZones({ storeId, page, limit });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener zonas'
            });
        }
    };

    createZone = async (req, res) => {
        try {
            const data = req.body;

            const defaultHours = () => {
                const hours = {};
                for (let h = 10; h <= 18; h++) {
                    if (h !== 13) {
                        const hourStr = `${h.toString().padStart(2, '0')}:00`;
                        hours[hourStr] = true;
                    }
                }
                return hours;
            };

            const defaultSchedule = {
                monday: { enabled: true, hours: defaultHours() },
                tuesday: { enabled: true, hours: defaultHours() },
                wednesday: { enabled: true, hours: defaultHours() },
                thursday: { enabled: true, hours: defaultHours() },
                friday: { enabled: true, hours: defaultHours() },
                saturday: { enabled: false, hours: {} },
                sunday: { enabled: false, hours: {} }
            };

            const newZone = new Zones({
                ...data,
                deliveryCost: typeof data.deliveryCost === 'number' ? data.deliveryCost : 0,
                schedule: data.schedule || defaultSchedule
            });

            const saved = await newZone.save();

            return res.status(201).json({
                success: true,
                message: 'Zona creada correctamente',
                data: saved,
            });
        } catch (error) {
            console.error('❌ Error al crear zona:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al crear zona',
            });
        }
    };




    updateZone = async (req, res) => {
        try {
            const zoneData = {
                ...req.body,
                schedule: req.body.schedule || {}, // 🟢 permite update del schedule también
            };
            const response = await service.updateZone(req.params.id, zoneData);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar zona'
            });
        }
    };

    deleteZone = async (req, res) => {
        try {
            const response = await service.deleteZone(req.params.id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar zona'
            });
        }
    };
}
