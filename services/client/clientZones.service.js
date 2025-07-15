import connectMongoDB from '../../libs/mongoose.js';
import Zones from '../../models/Zones.js';
import Stores from '../../models/Stores.js';

export default class ClientZonesService {
    constructor() {
        connectMongoDB();
    }

    resolveLocation = async ({ lat, lon }) => {
        try {
            console.log('🔍 Buscando todas las zonas...');
            const zones = await Zones.find().lean();
            console.log('📦 Total de zonas encontradas:', zones.length);

            if (!zones.length) {
                return { success: false, message: 'No hay zonas configuradas' };
            }

            const isPointInPolygon = (point, polygon) => {
                let inside = false;
                const x = point.lat, y = point.lng;

                for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                    const xi = polygon[i].lat, yi = polygon[i].lng;
                    const xj = polygon[j].lat, yj = polygon[j].lng;

                    const intersect = ((yi > y) !== (yj > y)) &&
                        (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-10) + xi);

                    if (intersect) inside = !inside;
                }

                return inside;
            };

            const matchingZones = zones.filter((zone) =>
                isPointInPolygon({ lat, lng: lon }, zone.polygon)
            );

            if (!matchingZones.length) {
                return { success: false, message: 'No hay cobertura en esta ubicación' };
            }

            console.log('✅ Zonas que contienen el punto:', matchingZones.length);

            // Obtener storeIds únicos de las zonas coincidentes
            const storeIds = matchingZones.map((z) => z.storeId);

            // Buscar tiendas que estén en esas zonas y disponibles en marketplace
            const stores = await Stores.find({
                _id: { $in: storeIds },
                availableInMarketplace: true,
            })
                .select('name image phone address schedules')
                .lean();

            // Si no hay tiendas disponibles
            if (!stores.length) {
                return { success: false, message: 'No hay tiendas disponibles en esta ubicación' };
            }

            // Adjuntar zoneId a cada tienda
            const storesWithZone = stores.map((store) => {
                const matchedZone = matchingZones.find(z => String(z.storeId) === String(store._id));
                return {
                    ...store,
                    storeId: store._id,
                    zoneId: matchedZone?._id || null,
                };
            });

            return {
                success: true,
                message: 'Zonas encontradas',
                data: {
                    stores: storesWithZone,
                },
            };
        } catch (error) {
            console.error('❌ Servicio - Error en resolveLocation:', error);
            return {
                success: false,
                message: 'Error inesperado al buscar zona',
            };
        }
    };

    isLocationInStoreZone = async ({ lat, lon, storeId }) => {
        try {
            // Validar que la tienda esté activa y habilitada para pagos
            const store = await Stores.findOne({ _id: storeId, availableInMarketplace: true, payment: true }).lean();
            if (!store) return false;

            // Buscar zonas de esa tienda
            const zones = await Zones.find({ storeId }).lean();
            if (!zones.length) return false;

            const isPointInPolygon = (point, polygon) => {
                let inside = false;
                const x = point.lat, y = point.lng;

                for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                    const xi = polygon[i].lat, yi = polygon[i].lng;
                    const xj = polygon[j].lat, yj = polygon[j].lng;

                    const intersect = ((yi > y) !== (yj > y)) &&
                        (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-10) + xi);

                    if (intersect) inside = !inside;
                }

                return inside;
            };

            // Revisar si alguna zona contiene la ubicación
            const matching = zones.some(zone =>
                isPointInPolygon({ lat, lng: lon }, zone.polygon)
            );

            return matching;
        } catch (error) {
            console.error('❌ Servicio - Error en isLocationInStoreZone:', error);
            return false;
        }
    };

}
