const { sumAmounts, totalsByCategory } = require('../utils/currencyUtils');
const { CLAIM_STATUS } = require('../config/constants');

const FINAL = [CLAIM_STATUS.APPROVED, CLAIM_STATUS.REJECTED];

const buildSummary = (claims) => {
  const groups = {};
  const statusCounts = {};

  for (const c of claims) {
    const currency = c.currency || 'INR';
    (groups[currency] = groups[currency] || []).push(c);
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  }

  const byCurrency = {};
  for (const [currency, list] of Object.entries(groups)) {
    const { count, total, byCategory } = totalsByCategory(
      list.map((c) => ({ category: c.finalCategory || c.category, amount: c.amount }))
    );

    const sumWhere = (fn) => sumAmounts(list.filter(fn).map((c) => c.amount));

    byCurrency[currency] = {
      count,
      total,
      byCategory,
      approved: sumWhere((c) => c.status === CLAIM_STATUS.APPROVED),
      rejected: sumWhere((c) => c.status === CLAIM_STATUS.REJECTED),
      open: sumWhere((c) => !FINAL.includes(c.status)),
    };
  }

  return { count: claims.length, statusCounts, byCurrency };
};

module.exports = { buildSummary };