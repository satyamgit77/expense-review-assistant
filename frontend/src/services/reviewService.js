import api from './api';

const patch = async (id, action, body) => {
  const res = await api.patch(`/review/${id}/${action}`, body);
  return res.data.claim;
};

export const approveClaim = (id, reason) => patch(id, 'approve', { reason });
export const rejectClaim = (id, reason) => patch(id, 'reject', { reason });
export const requestClarification = (id, message) => patch(id, 'clarify', { message });
export const overrideCategory = (id, category, reason) =>
  patch(id, 'override', { category, reason });