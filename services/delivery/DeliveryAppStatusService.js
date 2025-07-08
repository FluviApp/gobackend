export default class DeliveryAppStatusService {
    getStatus = async () => {
        return {
            success: true,
            data: {
                appVersion: '1.0.0',
                isPaymentActive: false, // cambia según tu lógica
            }
        };
    };
}
