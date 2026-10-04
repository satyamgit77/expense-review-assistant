const rateLimit = require('express-rate-limit');

// Login/register: sirf FAIL hui koshishein gini jaati hain (brute-force rokne ke liye)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many failed attempts. Please try again in a few minutes.' },
});

// Claim submit: har submit par AI chalta hai, isliye har user ki limit
const claimSubmitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  keyGenerator: (req) => String(req.user?._id || 'anonymous'),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'You are submitting claims too quickly. Please wait a few minutes.' },
});

module.exports = { authLimiter, claimSubmitLimiter };