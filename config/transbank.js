import transbank from 'transbank-sdk';

const WebpayPlus = transbank.default.WebpayPlus ?? transbank.WebpayPlus;
const IntegrationCommerceCodes = transbank.default.IntegrationCommerceCodes ?? transbank.IntegrationCommerceCodes;
const IntegrationApiKeys = transbank.default.IntegrationApiKeys ?? transbank.IntegrationApiKeys;

export const configureTransbank = () => {
    WebpayPlus.Transaction.configureForIntegration(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY,
        'https://webpay3gint.transbank.cl'
    );
};
