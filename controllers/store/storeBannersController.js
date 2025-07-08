import StoreBannersService from '../../services/store/storeBanners.service.js';

const storeBannersService = new StoreBannersService();

export default class StoreBannersController {
    getAllBanners = async (req, res) => {
        try {
            const { storeId } = req.query;

            const response = await storeBannersService.getAllBanners({ storeId });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener banners:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener banners',
            });
        }
    };

    createBanner = async (req, res) => {
        try {
            const image = req.files?.image || null;
            if (!image) {
                return res.status(400).json({ success: false, message: 'La imagen es obligatoria' });
            }

            const response = await storeBannersService.createBanner({
                ...req.body,
                image,
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al crear banner:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al crear banner',
            });
        }
    };

    updateBanner = async (req, res) => {
        try {
            const { id } = req.params;
            const image = req.files?.image || null;

            const response = await storeBannersService.updateBanner(id, {
                ...req.body,
                image,
            });

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al actualizar banner:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al actualizar banner',
            });
        }
    };

    deleteBanner = async (req, res) => {
        try {
            const { id } = req.params;

            const response = await storeBannersService.deleteBanner(id);

            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al eliminar banner:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al eliminar banner',
            });
        }
    };
}
