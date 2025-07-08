import StoreAuthService from '../../services/store/storeAuth.service.js'
const StoreAuth = new StoreAuthService()

export default class StoreAuthController {

    login = async (req, res) => {
        try {
            const response = await StoreAuth.login(req.body);

            const status = response.success ? 200 : 401;
            return res.status(status).json(response);

        } catch (error) {
            console.error('❌ Controller - error en login:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor'
            });
        }
    };

    checkCommerceStatus = async (req, res) => {
        try {
            const { email } = req.params;

            const response = await StoreAuth.checkCommerceStatus(email);

            const status = response.success ? 200 : 404;
            return res.status(status).json(response);
        } catch (error) {
            console.error('❌ Controller - error en checkCommerceStatus:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error inesperado en el servidor'
            });
        }
    };

}
