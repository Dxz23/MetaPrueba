// src/config/env.js
import 'dotenv/config';

const config = {
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN || 'prueba',
  API_TOKEN: process.env.API_TOKEN || 'EAAIjQKlW1TYBOzROTOOspoxfJccfSxu0IpemqJ7oScJZCyy1Iq02HkqNYhC7uvLh1QRBpZCNB8pcvOeBgasuJwn7ByRwB3YJFQca1DCbwHAWyyd6NpMOd0nyZBWjsyYiSZCclOaGfljZAjFhqU6lzhFeo9x3FhGdLJdjlha4UmObwO9ZA8grpthqpqma7woKBZCq3SbnDNRAjtZCwho6AXsVHziDeaQZD',
  PORT: process.env.PORT || 3000,
  BUSINESS_PHONE: process.env.BUSINESS_PHONE || '536601786208408',
  API_VERSION: process.env.API_VERSION || 'v22.0',
  BASE_URL: process.env.BASE_URL || 'https://graph.facebook.com'
};

console.log('Config BASE_URL:', config.BASE_URL);
export default config;
