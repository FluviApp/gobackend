import fetch from 'node-fetch';

// Envía una notificación Expo a uno o varios tokens en una sola request.
// tokens: string | string[]. Ignora los que no sean ExponentPushToken válidos.
export const sendExpoPush = async ({ tokens = [], title, body, data = {} }) => {
    const list = (Array.isArray(tokens) ? tokens : [tokens])
        .filter((t) => typeof t === 'string' && t.startsWith('ExponentPushToken'));

    if (!list.length) {
        console.warn('⚠️ sendExpoPush: sin tokens válidos');
        return { sent: 0 };
    }

    const messages = list.map((to) => ({
        to,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
        channelId: 'default',
    }));

    try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });
        const result = await res.json();
        console.log('📲 Push Expo enviado:', JSON.stringify(result));
        return { sent: list.length, result };
    } catch (error) {
        console.error('❌ Error al enviar push Expo:', error);
        return { sent: 0, error };
    }
};

export default sendExpoPush;
