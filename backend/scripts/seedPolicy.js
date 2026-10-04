require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const PolicySection = require('../models/PolicySection');

const POLICY_DIR = path.join(__dirname, '../../policy');

// expense-policy.md ko sections me todta hai
const parsePolicy = (markdown) => {
  const sections = [];
  let currentCategory = null;
  let current = null;

  for (const line of markdown.split(/\r?\n/)) {
    const h2 = line.match(/^##\s+\d+\.\s+(.+)$/);
    const h3 = line.match(/^###\s+\[(\d+\.\d+)\]\s+(.+)$/);

    if (h2) {
      if (current) sections.push(current);
      current = null;
      currentCategory = h2[1].trim();
    } else if (h3) {
      if (current) sections.push(current);
      current = {
        sectionId: h3[1],
        category: currentCategory,
        title: h3[2].trim(),
        text: '',
      };
    } else if (current && line.trim()) {
      current.text += (current.text ? ' ' : '') + line.trim();
    }
  }
  if (current) sections.push(current);

  return sections;
};

const seed = async () => {
  try {
    const markdown = fs.readFileSync(path.join(POLICY_DIR, 'expense-policy.md'), 'utf8');
    const config = JSON.parse(
      fs.readFileSync(path.join(POLICY_DIR, 'policy.config.json'), 'utf8')
    );

    // limitSectionId -> limit amount
    const limitBySection = {};
    for (const cat of Object.values(config.categories)) {
      limitBySection[cat.limitSectionId] = cat.limit;
    }

    const sections = parsePolicy(markdown).map((s) => ({
      ...s,
      limitAmount: limitBySection[s.sectionId],
    }));

    await mongoose.connect(process.env.MONGODB_URI);

    for (const s of sections) {
      await PolicySection.findOneAndUpdate({ sectionId: s.sectionId }, s, {
        upsert: true,
        returnDocument: 'after',
      });
      console.log(
        `Saved [${s.sectionId}] ${s.category} - ${s.title}` +
          (s.limitAmount ? ` (limit ₹${s.limitAmount})` : '')
      );
    }

    console.log(`\nDone. ${sections.length} sections seeded.`);
  } catch (error) {
    console.error('Policy seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

seed();