const express = require('express');
const app = express();
const cors = require('cors');
const { shopify, BILLING_SETTINGS } = require('./shopify');
const { generatePrompt } = require('./utils/prompt');
const fetch = require('node-fetch');
require('dotenv').config();

// Configure CORS
app.use(cors({
  origin: process.env.SHOPIFY_APP_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'SmartFAQ.AI API is running' });
});

// OAuth endpoints
app.get('/auth', async (req, res) => {
  if (!req.query.shop) {
    res.status(400).send('Missing shop parameter');
    return;
  }

  const authRoute = await shopify.auth.begin({
    shop: req.query.shop,
    callbackPath: '/auth/callback',
    isOnline: true,
  });

  res.redirect(authRoute);
});

app.get('/auth/callback', async (req, res) => {
  try {
    const { session } = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    // Check/create billing subscription
    const hasSubscription = await ensureSubscription(session);
    if (!hasSubscription) {
      return res.redirect(`/billing?shop=${session.shop}`);
    }

    res.redirect(`/?shop=${session.shop}&host=${req.query.host}`);
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('OAuth failed');
  }
});

// Billing endpoint
app.get('/billing', async (req, res) => {
  const session = await shopify.session.getCurrentSession(req, res);
  
  const billingUrl = await shopify.billing.request({
    session,
    ...BILLING_SETTINGS,
    returnUrl: `${process.env.SHOPIFY_APP_URL}?shop=${session.shop}`,
  });

  res.redirect(billingUrl);
});

// Product endpoints
app.get('/api/products', async (req, res) => {
  try {
    const session = await shopify.session.getCurrentSession(req, res);
    const client = new shopify.clients.Rest({ session });

    const response = await client.get({
      path: 'products',
      query: { fields: 'id,title,body_html' }
    });

    res.json(response.body.products);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/save-faqs', async (req, res) => {
  try {
    const { productId, faqs } = req.body;
    const session = await shopify.session.getCurrentSession(req, res);
    const client = new shopify.clients.Rest({ session });

    await client.put({
      path: `products/${productId}/metafields`,
      data: {
        metafield: {
          namespace: 'custom',
          key: 'faqs',
          value: JSON.stringify(faqs),
          type: 'json'
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Save FAQs error:', error);
    res.status(500).json({ error: 'Failed to save FAQs' });
  }
});

app.post('/generate-faqs', async (req, res) => {
  try {
    const { productName, productDescription } = req.body;

    if (!productName || !productDescription) {
      return res.status(400).json({ error: 'Product name and description are required' });
    }

    const prompt = `You are an eCommerce assistant. Generate 5 helpful FAQ questions and answers for the following product:\n\nProduct Name: ${productName}\nProduct Description: ${productDescription}\n\nFAQs should be helpful, concise, and in simple language.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.SHOPIFY_APP_URL,
        'X-Title': 'SmartFAQ.AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenRouter API error:', error);
      return res.status(response.status).json({ error: 'Failed to generate FAQs' });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ error: 'Invalid response from AI service' });
    }

    res.json({ faqs: data.choices[0].message.content });
  } catch (error) {
    console.error('Error generating FAQs:', error);
    res.status(500).json({ error: 'Failed to generate FAQs' });
  }
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:${port}\`);
});
