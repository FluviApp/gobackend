export default class ClientVersionService {
    getMinimumVersionInfo = async () => {
        console.log('🔧 Obteniendo versión mínima desde el service...');

        const data = {
            minVersion: '3.0.3',
            iosStoreUrl: 'https://apps.apple.com/app/idXXXXXXXXX',
            androidStoreUrl: 'https://play.google.com/store/apps/details?id=com.Fluvi.Go'
        };

        console.log('✅ Versión mínima preparada:', data);

        return data;
    };
}

