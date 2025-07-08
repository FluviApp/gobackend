import { Resend } from 'resend';

const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error('❌ RESEND_API_KEY no está definido en .env');
    }

    return new Resend(apiKey);
};

export default getResendClient;
