require('dotenv').config();
const { classifyClaim } = require('../services/aiService');

const samples = [
  ['Cab used for client meeting', 'Travel'],
  ['Had dinner with client', 'Client Entertainment'],
  ['Lunch during office hours', 'Meals'],
  ['Hotel stay in Pune for one night', 'Accommodation'],
  ['Bought printer paper and pens', 'Office Supplies'],
  ['Miscellaneous expense', 'uncertain (low confidence)'],
];

const run = async () => {
  for (const [description, expected] of samples) {
    try {
      const r = await classifyClaim(description);
      console.log(`\n"${description}"`);
      console.log(`  expected : ${expected}`);
      console.log(`  got      : ${r.category} (confidence ${r.confidence}, uncertain: ${r.isUncertain})`);
      console.log(`  reason   : ${r.reason}`);
    } catch (error) {
      console.log(`\n"${description}"\n  FAILED: ${error.message}`);
    }
  }
};

run();