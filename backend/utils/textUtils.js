const MAX_DESCRIPTION_CHARS = 1000;

// Description ko prompt me daalne se pehle saaf karna
const sanitizeDescription = (text) =>
  String(text ?? '')
    // <claim_description>, </claim_description>, < / CLAIM_DESCRIPTION >, <claim_description x="1"> sab hatao
    .replace(/<\s*\/?\s*claim_description[^>]*>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_DESCRIPTION_CHARS);

module.exports = { sanitizeDescription, MAX_DESCRIPTION_CHARS };