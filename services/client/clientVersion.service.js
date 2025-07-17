export default class ClientVersionService {
    getMinimumVersionInfo = async () => {
        // Podrías cargar esto desde una base de datos en el futuro si lo necesitas dinámico
        return {
            minVersion: '3.0.4', // Actualiza esto con cada nueva versión
            iosStoreUrl: 'https://apps.apple.com/app/idXXXXXXXXX',
            androidStoreUrl: 'https://play.google.com/store/apps/details?id=com.Fluvi.Go'
        };
    };
}
