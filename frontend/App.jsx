import React, { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Select,
  Button,
  SkeletonBodyText,
  Banner,
  List
} from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { getSessionToken } from "@shopify/app-bridge-utils";

function App() {
  const app = useAppBridge();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [faqs, setFaqs] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = await getSessionToken(app);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      setError('Failed to fetch products');
    }
  };

  const generateFaqs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const product = products.find(p => p.id === selectedProduct);
      const token = await getSessionToken(app);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/generate-faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productName: product.title,
          productDescription: product.body_html.replace(/<[^>]*>/g, '')
        })
      });
      const data = await response.json();
      setFaqs(data.faqs);
    } catch (error) {
      setError('Failed to generate FAQs');
    } finally {
      setIsLoading(false);
    }
  };

  const saveFaqs = async () => {
    setIsSaving(true);
    setError('');
    try {
      const token = await getSessionToken(app);
      await fetch(`${process.env.REACT_APP_API_URL}/api/save-faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: selectedProduct,
          faqs
        })
      });
    } catch (error) {
      setError('Failed to save FAQs');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Page title="SmartFAQ.AI">
      <Layout>
        {error && (
          <Layout.Section>
            <Banner status="critical">{error}</Banner>
          </Layout.Section>
        )}
        
        <Layout.Section>
          <Card sectioned>
            <Select
              label="Select a product"
              options={products.map(p => ({ label: p.title, value: p.id }))}
              onChange={setSelectedProduct}
              value={selectedProduct}
            />
            <div style={{ marginTop: '1rem' }}>
              <Button
                primary
                onClick={generateFaqs}
                loading={isLoading}
                disabled={!selectedProduct}
              >
                Generate FAQs
              </Button>
            </div>
          </Card>
        </Layout.Section>

        {faqs && (
          <Layout.Section>
            <Card sectioned>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {faqs}
              </div>
              <div style={{ marginTop: '1rem' }}>
                <Button
                  primary
                  onClick={saveFaqs}
                  loading={isSaving}
                >
                  Save FAQs to Shopify
                </Button>
              </div>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}

export default App;
      productName,
      productDescription
    });
    setFaqs(response.data.faqs);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>SmartFAQ.AI</h1>
      <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Product Name" />
      <br /><br />
      <textarea value={productDescription} onChange={e => setProductDescription(e.target.value)} placeholder="Product Description" rows="5" cols="40" />
      <br /><br />
      <button onClick={handleGenerate}>Generate FAQs</button>
      <pre>{faqs}</pre>
    </div>
  );
}

export default App;
