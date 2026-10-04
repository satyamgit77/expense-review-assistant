
require('dotenv').config();
const { generateText, PROVIDER, MODEL } = require('../config/ai');

const run = async () => {
  try {
    console.log('Provider:', PROVIDER);
    console.log('Model:', MODEL);

    const text = await generateText({ prompt: 'Reply with exactly one word: ready' });
    console.log('Text reply:', text.trim());

    const jsonText = await generateText({
      prompt: 'Return a JSON object with one key "status" and the value "ok".',
      json: true,
    });
    console.log('JSON reply:', JSON.parse(jsonText));
  } catch (error) {
    console.error('AI test failed:', error.message);
  }
};

run();