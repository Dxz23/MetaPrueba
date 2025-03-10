// src/config/env.js
import 'dotenv/config';

const config = {
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN || 'prueba',
  API_TOKEN: process.env.API_TOKEN || 'EAAIjQKlW1TYBO6cvVm9VOnFyZCMbC9ZAWHbEb2nwNflfWIXY7snRfAztImMBADx3ZCpWqDdQBmNyGdhZBfihi9vqrPE8umNw0joo98EdRQdvCvIfI0ZBt9hDRq4eojpBbOMx4xjQ1JpWb1X2deH4B9eb3JSugZCSm4hQlyTBnMfPUvOBnHcKbHuqWa7GIW2QN5kgZDZD',
  PORT: process.env.PORT || 3000,
  BUSINESS_PHONE: process.env.BUSINESS_PHONE || '540626332472824',
  API_VERSION: process.env.API_VERSION || 'v22.0',
  BASE_URL: process.env.BASE_URL || 'https://graph.facebook.com'
};

console.log('Config BASE_URL:', config.BASE_URL);
export default config;
