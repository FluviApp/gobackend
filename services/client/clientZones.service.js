import connectMongoDB from '../../libs/mongoose.js';
import Zones from '../../models/Zones.js';
import Stores from '../../models/Stores.js';
import { isPointInPolygon, zonePolygon, buildComunaPolyMap } from '../../libs/geo.js';

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

            // Las zonas tipo 'comuna' toman su límite del catálogo Comunas (por slug);
            // las tipo 'area' usan su propio polygon.
            const comunaMap = await buildComunaPolyMap(zones);
            const matchingZones = zones.filter((zone) =>
                isPointInPolygon({ lat, lng: lon }, zonePolygon(zone, comunaMap))
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
                payment: true,
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

    // isLocationInStoreZone = async ({ lat, lon, storeId }) => {
    //     try {
    //         console.log('📥 Validando zona para:', { lat, lon, storeId });

    //         const store = await Stores.findOne({ _id: storeId }).lean();
    //         if (!store) {
    //             console.log('❌ Tienda no encontrada');
    //             return {
    //                 allowed: false,
    //                 reason: 'not_found',
    //                 message: 'Distribuidor no encontrado.',
    //             };
    //         }

    //         console.log('🏪 Tienda encontrada:', store.name);
    //         console.log('⚙️ Flags:', {
    //             availableInMarketplace: store.availableInMarketplace,
    //             payment: store.payment
    //         });

    //         if (!store.availableInMarketplace) {
    //             return {
    //                 allowed: false,
    //                 reason: 'unavailable',
    //                 message: 'Este distribuidor ha desactivado sus repartos. Puedes buscar otro en el menú lateral.',
    //             };
    //         }

    //         if (!store.payment) {
    //             return {
    //                 allowed: false,
    //                 reason: 'payment_blocked',
    //                 message: 'Lamentamos esto, pero el distribuidor no está al día con sus pagos. Puedes esperar o elegir otro en el menú lateral.',
    //             };
    //         }

    //         const zones = await Zones.find({ storeId }).lean();
    //         console.log('📦 Zonas encontradas:', zones.length);

    //         if (!zones.length) {
    //             return {
    //                 allowed: false,
    //                 reason: 'no_zones',
    //                 message: 'Este distribuidor no tiene zonas configuradas actualmente. Busca otro en el menú lateral.',
    //             };
    //         }

    //         const isPointInPolygon = (point, polygon) => {
    //             let inside = false;
    //             const x = point.lat, y = point.lng;

    //             for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    //                 const xi = polygon[i].lat, yi = polygon[i].lng;
    //                 const xj = polygon[j].lat, yj = polygon[j].lng;

    //                 const intersect = ((yi > y) !== (yj > y)) &&
    //                     (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-10) + xi);

    //                 if (intersect) inside = !inside;
    //             }

    //             return inside;
    //         };

    //         let matchedZoneCount = 0;

    //         zones.forEach(zone => {
    //             const inZone = isPointInPolygon({ lat, lng: lon }, zone.polygon);
    //             console.log(`📍 Zona ${zone._id} => dentro:`, inZone);
    //             if (inZone) matchedZoneCount++;
    //         });

    //         if (matchedZoneCount === 0) {
    //             console.log('🚫 Ninguna zona contiene el punto');
    //             return {
    //                 allowed: false,
    //                 reason: 'out_of_zone',
    //                 message: 'El distribuidor dejó de hacer repartos en tu zona. Puedes cambiar de distribuidor en el menú lateral.',
    //             };
    //         }

    //         console.log('✅ Punto dentro de zona(s)');
    //         return {
    //             allowed: true,
    //             message: 'Ubicación válida para esta tienda.',
    //         };

    //     } catch (error) {
    //         console.error('❌ Servicio - Error en isLocationInStoreZone:', error);
    //         return {
    //             allowed: false,
    //             reason: 'server_error',
    //             message: 'Hubo un error al verificar la zona. Intenta más tarde.',
    //         };
    //     }
    // };
    isLocationInStoreZone = async ({ lat, lon, storeId }) => {
        try {
            console.log('📥 Validando zona para:', { lat, lon, storeId });

            const store = await Stores.findOne({ _id: storeId }).lean();
            if (!store) {
                return {
                    allowed: false,
                    reason: 'not_found',
                    message: 'Distribuidor no encontrado.',
                };
            }

            if (!store.availableInMarketplace) {
                return {
                    allowed: false,
                    reason: 'unavailable',
                    message: 'Este distribuidor ha desactivado sus repartos.',
                };
            }

            if (!store.payment) {
                return {
                    allowed: false,
                    reason: 'payment_blocked',
                    message: 'Distribuidor con pagos pendientes.',
                };
            }

            const zones = await Zones.find({ storeId }).lean();
            if (!zones.length) {
                return {
                    allowed: false,
                    reason: 'no_zones',
                    message: 'Este distribuidor no tiene zonas configuradas.',
                };
            }

            const comunaMap = await buildComunaPolyMap(zones);
            for (const zone of zones) {
                const inZone = isPointInPolygon({ lat, lng: lon }, zonePolygon(zone, comunaMap));
                if (inZone) {
                    console.log(`✅ Punto dentro de zona ${zone._id}`);
                    return {
                        allowed: true,
                        message: 'Ubicación válida para esta tienda.',
                        zoneId: zone._id.toString()
                    };
                }
            }

            return {
                allowed: false,
                reason: 'out_of_zone',
                message: 'El distribuidor dejó de hacer repartos en tu zona.',
            };

        } catch (error) {
            console.error('❌ Servicio - Error en isLocationInStoreZone:', error);
            return {
                allowed: false,
                reason: 'server_error',
                message: 'Hubo un error al verificar la zona. Intenta más tarde.',
            };
        }
    };



}
