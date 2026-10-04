const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const isValidDate = (d) => {
  if (d === undefined || d === null || d === '') return false;
  return !isNaN(new Date(d).getTime());
};

// to - from, poore dino me
const daysBetween = (from, to) =>
  Math.round((startOfDay(to) - startOfDay(from)) / 86400000);

module.exports = { startOfDay, isValidDate, daysBetween };