import dotenv from 'dotenv';
dotenv.config();

export default {
  PORT: process.env.PORT || 3001,
  API_TOKEN: process.env.API_TOKEN,
  BUSINESS_PHONE: process.env.BUSINESS_PHONE,
  API_VERSION: process.env.API_VERSION,
  BASE_URL: process.env.BASE_URL,
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN,
};
