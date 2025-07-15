import ClientZonesService from '../../services/client/clientZones.service.js';

const clientZonesService = new ClientZonesService();

export default class ClientZonesController {
    resolveLocation = async (req, res) => {
        try {
            const { lat, lon } = req.body;
            console.log('📥 Coordenadas recibidas en controller:', { lat, lon });

            if (!lat || !lon) {
                console.log('⚠️ Coordenadas faltantes');
                return res.status(400).json({ success: false, message: 'Faltan coordenadas' });
            }

            const response = await clientZonesService.resolveLocation({ lat, lon });
            console.log('📤 Respuesta del service:', response);

            return res.status(200).json(response);
        } catch (error) {
            console.error('❌ Controller - Error en resolveLocation:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al resolver ubicación',
            });
        }
    };

    validateStoreLocation = async (req, res) => {
        try {
            const { lat, lon, storeId } = req.body;

            if (!lat || !lon || !storeId) {
                return res.status(400).json({ success: false, message: 'Faltan datos' });
            }

            const result = await clientZonesService.isLocationInStoreZone({ lat, lon, storeId });

            return res.status(200).json({
                success: true,
                data: {
                    isCovered: result
                }
            });
        } catch (error) {
            console.error('❌ Error en validateStoreLocation:', error);
            return res.status(500).json({ success: false, message: 'Error al validar cobertura' });
        }
    };


}
