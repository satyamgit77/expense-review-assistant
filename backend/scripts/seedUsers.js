require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

const users = [
  {
    name: process.env.SEED_REVIEWER_NAME,
    email: process.env.SEED_REVIEWER_EMAIL,
    password: process.env.SEED_REVIEWER_PASSWORD,
    role: ROLES.REVIEWER,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log(`Skipped (already exists): ${u.email}`);
        continue;
      }
      const passwordHash = await bcrypt.hash(u.password, 10);
      await User.create({
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
      });
      console.log(`Created: ${u.email} (${u.role})`);
    }
  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

seed();