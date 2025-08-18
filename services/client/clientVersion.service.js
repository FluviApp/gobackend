export default class ClientVersionService {
    getMinimumVersionInfo = async () => {
        console.log('🔧 Obteniendo versión mínima desde el service...');

        const data = {
            minVersion: '3.0.5',
            iosStoreUrl: 'https://apps.apple.com/cl/app/fluvi/id1486119050',
            androidStoreUrl: 'https://play.google.com/store/apps/details?id=com.Fluvi.Go'
        };

        console.log('✅ Versión mínima preparada:', data);

        return data;
    };
}

