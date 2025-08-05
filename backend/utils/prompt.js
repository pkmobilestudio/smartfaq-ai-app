const generatePrompt = (productName, productDescription) => {
  return `You are an eCommerce assistant. Generate 5 helpful FAQ questions and answers for the following product:

Product Name: ${productName}
Product Description: ${productDescription}

FAQs should be helpful, concise, and in simple language. Format each FAQ as:
Q1: [Question]
A1: [Answer]

Q2: [Question]
A2: [Answer]

etc.`;
};

module.exports = { generatePrompt };
