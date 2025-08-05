# SmartFAQ.AI - Shopify App

An AI-powered FAQ generator for your Shopify products using OpenRouter's GPT-3.5 Turbo model.

## Features

- 🤖 Auto-generate FAQs using AI
- 🏪 Seamless Shopify integration
- 📝 Save FAQs as product metafields
- 💳 Subscription-based billing
- 🔒 Secure OAuth authentication

## Setup

1. Create a new app in your Shopify Partner Dashboard
2. Set the App URL and Allowed redirection URL(s)
3. Copy `.env.example` to `.env` and fill in your credentials:
   - Shopify API key and secret
   - OpenRouter API key
   - App URL

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Development

- Backend runs on Express.js (default port 3000)
- Frontend uses React + Shopify Polaris
- Uses OpenRouter API for AI integration
- Stores FAQs in Shopify product metafields

## Environment Variables

- `SHOPIFY_API_KEY`: Your Shopify app API key
- `SHOPIFY_API_SECRET`: Your Shopify app secret
- `SHOPIFY_APP_URL`: Your app's URL
- `SHOPIFY_SCOPES`: Required app scopes
- `OPENROUTER_API_KEY`: Your OpenRouter API key

## Metafield Structure

FAQs are stored in product metafields:
- Namespace: `custom`
- Key: `faqs`
- Type: `json`

## Deployment

### Backend (Railway)
1. Create new project
2. Add environment variables
3. Connect to GitHub repository
4. Deploy

### Frontend (Vercel)
1. Import project from GitHub
2. Add environment variables
3. Deploy

## License

MIT

1. Update API endpoint in App.jsx
2. Deploy React frontend using Vercel
