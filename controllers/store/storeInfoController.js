import StoreInfoService from '../../services/store/storeInfo.service.js';

const storeInfoService = new StoreInfoService();

export default class StoreInfoController {
    getStoreInfo = async (req, res) => {
        console.log('image')
        try {
            const { storeId } = req.query;
            const response = await storeInfoService.getStoreInfo({ storeId });
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener info de la tienda:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener info de la tienda',
            });
        }
    };
}
