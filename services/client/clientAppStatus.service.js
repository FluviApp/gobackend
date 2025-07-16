import connectMongoDB from '../../libs/mongoose.js';
import Commerce from '../../models/Commerce.js';
import Zones from '../../models/Zones.js';
import Stores from '../../models/Stores.js';

export default class ClientAppStatusService {
    constructor() {
        connectMongoDB();
    }

    getAppStatus = async () => {
        try {
            const commerce = await Commerce.findOne().lean(); // 👈 sin condiciones

            if (!commerce) {
                return {
                    success: false,
                    message: 'Comercio no encontrado',
                };
            }

            return {
                success: true,
                message: 'Estado de app obtenido correctamente',
                data: {
                    isPaymentActive: commerce.isPaymentActive,
                    appVersion: commerce.appVersion,
                    //ecommerceId: commerce.ecommerceId?.toString()
                },
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener estado de app:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener estado de app',
            };
        }
    };

    getStoreData = async (storeId) => {
        try {
            const store = await Stores.findOne({ _id: storeId }).lean();
            if (!store) {
                return { success: false, message: 'Tienda no encontrada' };
            }

            const zones = await Zones.find({ storeId }).lean();
            if (!zones || zones.length === 0) {
                return { success: false, message: 'Zonas de entrega no encontradas' };
            }

            // 🔽 Agregamos filtrado de horarios válidos
            const now = new Date();
            const todayIndex = now.getDay(); // 0 = domingo, ..., 6 = sábado
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

            const filterSchedule = (schedule) => {
                const filtered = {};

                daysOfWeek.forEach((day, index) => {
                    const dayConfig = schedule[day];
                    if (!dayConfig?.enabled || !dayConfig?.hours) return;

                    const validHours = {};

                    Object.entries(dayConfig.hours).forEach(([hourStr, isActive]) => {
                        if (!isActive) return;

                        const [hour, minute] = hourStr.split(':').map(Number);

                        if (index === todayIndex) {
                            if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
                                return;
                            }
                        }

                        if (index > todayIndex || index === todayIndex) {
                            validHours[hourStr] = true;
                        }
                    });

                    if (Object.keys(validHours).length > 0) {
                        filtered[day] = {
                            enabled: true,
                            hours: validHours
                        };
                    }
                });

                return filtered;
            };

            const formattedZones = zones.map(zone => ({
                deliveryCost: zone.deliveryCost,
                schedule: filterSchedule(zone.schedule)
            }));

            return {
                success: true,
                message: 'Datos de tienda obtenidos correctamente',
                data: {
                    paymentMethods: store.paymentmethod,
                    deliveryZones: formattedZones
                }
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener datos de tienda:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener datos de tienda',
            };
        }
    };
}
