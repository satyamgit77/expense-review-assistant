export const CATEGORIES = [
  'Travel',
  'Meals',
  'Accommodation',
  'Office Supplies',
  'Client Entertainment',
];

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
// Role ke hisaab se login ke baad ka ghar
export const homePathFor = (role) => (role === 'reviewer' ? '/review' : '/claims');