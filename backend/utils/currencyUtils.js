const toPaise = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid amount: ${n}`);
  }
  return Math.round(num * 100);
};

const fromPaise = (p) => p / 100;

const sumAmounts = (amounts) =>
  fromPaise(amounts.reduce((sum, a) => sum + toPaise(a), 0));

// claims ki list se grand total aur category-wise total
const totalsByCategory = (claims) => {
  let totalPaise = 0;
  const byCategoryPaise = {};

  for (const c of claims) {
    const p = toPaise(c.amount);
    totalPaise += p;
    byCategoryPaise[c.category] = (byCategoryPaise[c.category] || 0) + p;
  }

  const byCategory = {};
  for (const [cat, p] of Object.entries(byCategoryPaise)) {
    byCategory[cat] = fromPaise(p);
  }

  return { count: claims.length, total: fromPaise(totalPaise), byCategory };
};

module.exports = { toPaise, fromPaise, sumAmounts, totalsByCategory };