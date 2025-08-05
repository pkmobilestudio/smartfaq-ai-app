const express = require('express');
const app = express();
const cors = require('cors');
const { shopify, BILLING_SETTINGS } = require('./shopify');
const { generatePrompt } = require('./utils/prompt');
const fetch = require('node-fetch');
require('dotenv').config();

app.use(cors());
app.use(express.json());

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
  const { productName, productDescription } = req.body;

  const prompt = `You are an eCommerce assistant. Generate 5 helpful FAQ questions and answers for the following product:\\n\\nProduct Name: ${productName}\\nProduct Description: ${productDescription}\\n\\nFAQs should be helpful, concise, and in simple language.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer ${process.env.OPENROUTER_API_KEY}\`
    },
    body: JSON.stringify({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });

  const data = await response.json();
  res.json({ faqs: data.choices[0].message.content });
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:${port}\`);
});
