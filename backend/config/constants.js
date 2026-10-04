const ROLES = {
  EMPLOYEE: 'employee',
  REVIEWER: 'reviewer',
};

const CLAIM_STATUS = {
  PENDING: 'Pending',
  COMPLIANT: 'Compliant',
  NEEDS_REVIEW: 'Needs Review',
  CLARIFICATION: 'Clarification',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const CATEGORIES = [
  'Travel',
  'Meals',
  'Accommodation',
  'Office Supplies',
  'Client Entertainment',
];

module.exports = { ROLES, CLAIM_STATUS, CATEGORIES };