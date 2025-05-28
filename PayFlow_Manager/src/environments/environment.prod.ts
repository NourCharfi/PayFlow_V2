export const environment = {
  production: true,
  apiUrl: '/api',
  authApiUrl: '/api/auth',
  clientApiUrl: '/api/clients',
  productApiUrl: '/api/products',
  invoiceApiUrl: '/api/invoices',
  paymentApiUrl: '/api/payments',
  keycloak: {
    issuer: 'http://keycloak:8190/realms/Pay-Realm',
    clientId: 'payflow-web',
    scope: 'openid profile email'
  }
};
