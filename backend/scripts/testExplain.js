require('dotenv').config();
const mongoose = require('mongoose');
const { validateClaim } = require('../services/validationService');
const { getRelevantSections } = require('../services/policyService');
const { classifyClaim, explainClaim } = require('../services/aiService');

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const scenarios = [
  { category: 'Meals', amount: 1200, description: 'Team lunch', receiptAvailable: true },
  { category: 'Meals', amount: 2000, description: 'Team lunch', receiptAvailable: false },
  { category: 'Travel', amount: 2500, description: 'Taxi', receiptAvailable: true },
  {
    category: 'Travel',
    amount: 2500,
    description: 'Cab from Pune office to Mumbai client site for a contract meeting',
    receiptAvailable: true,
  },
  { category: 'Client Entertainment', amount: 3000, description: 'Dinner', receiptAvailable: true },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    for (const s of scenarios) {
      const claim = { date: yesterday(), currency: 'INR', ...s };
      console.log(`\n=== ${claim.category}, Rs ${claim.amount}, "${claim.description}"`);

      const validation = validateClaim(claim);
      const sections = await getRelevantSections(claim.category, validation.results);
      const classification = await classifyClaim(claim.description);
      const out = await explainClaim({
        claim,
        classification,
        validationResults: validation.results,
        sections,
      });

      console.log('AI category   :', classification.category, `(${classification.confidence})`);
      console.log('Explanation   :', out.explanation);
      console.log('Questions     :', out.questions.length ? out.questions : 'none');
      console.log('Primary section:', out.policySectionId);
      console.log('Evidence      :\n' + out.policyEvidence);
    }
  } catch (error) {
    console.error('Explain test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();