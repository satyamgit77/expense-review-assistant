require('dotenv').config();
const mongoose = require('mongoose');
const { validateClaim } = require('../services/validationService');
const { getRelevantSections, formatEvidence } = require('../services/policyService');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const d = new Date();
    d.setDate(d.getDate() - 1);
    const date = d.toISOString().slice(0, 10);

    // Meals, 2000 (limit se upar) aur receipt nahi
    const claim = {
      date,
      category: 'Meals',
      amount: 2000,
      currency: 'INR',
      description: 'Team lunch',
      receiptAvailable: false,
    };

    const validation = validateClaim(claim);
    console.log('Failed checks:', validation.results.filter((r) => !r.passed).map((r) => r.check));

    const sections = await getRelevantSections(claim.category, validation.results);
    console.log(`\nRetrieved ${sections.length} sections:\n`);
    for (const s of sections) {
      console.log(`[${s.sectionId}] reasons: ${s.reasons.join(', ')}`);
      console.log(`  ${formatEvidence(s)}\n`);
    }
  } catch (error) {
    console.error('Retrieval test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();