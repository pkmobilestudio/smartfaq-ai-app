const Shopify = require('@shopify/shopify-api').shopifyApi;
const { restResources } = require('@shopify/shopify-api/rest/admin/2023-07');

const shopify = Shopify({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES.split(','),
  hostName: process.env.SHOPIFY_APP_URL.replace(/https?:\/\//, ''),
  hostScheme: 'https',
  apiVersion: '2023-07',
  isEmbeddedApp: true,
  restResources
});

const BILLING_SETTINGS = {
  required: true,
  chargeName: 'SmartFAQ.AI Monthly',
  amount: 9.99,
  currencyCode: 'USD',
  interval: 'EVERY_30_DAYS',
};

module.exports = { shopify, BILLING_SETTINGS };
