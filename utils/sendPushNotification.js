import fetch from 'node-fetch';

const statusMessages = {
    pendiente: 'Hemos recibido tu pedido y lo revisaremos pronto.',
    confirmado: '¡Tu pedido ha sido confirmado!',
    preparando: 'Estamos preparando tu pedido.',
    en_camino: '¡Tu pedido va en camino!',
    entregado: 'Tu pedido fue entregado. ¡Gracias!',
    retrasado: 'Tu pedido está retrasado.',
    devuelto: 'Tu pedido fue devuelto.',
    cancelado: 'Tu pedido fue cancelado.',
};

export const sendPushNotification = async ({ token, status }) => {
    if (!token || !token.startsWith('ExponentPushToken')) {
        console.warn('❌ Token inválido:', token);
        return;
    }

    const message = {
        to: token,
        sound: 'default',
        title: '📦 Pedido actualizado',
        body: statusMessages[status] || 'Tu pedido ha cambiado de estado',
        data: { status },
    };

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const result = await response.json();
        console.log('📲 Notificación enviada:', result);
    } catch (error) {
        console.error('❌ Error al enviar notificación push:', error);
    }
};
