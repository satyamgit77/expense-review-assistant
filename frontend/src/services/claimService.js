import api from './api';

export const createClaim = async (data) => {
  const res = await api.post('/claims', data);
  return res.data.claim;
};

export const listClaims = async (params = {}) => {
  const res = await api.get('/claims', { params });
  return res.data.claims;
};

export const getClaim = async (id) => {
  const res = await api.get(`/claims/${id}`);
  return res.data.claim;
};

export const getSummary = async () => {
  const res = await api.get('/claims/summary');
  return res.data;
};

export const respondToClarification = async (id, response) => {
  const res = await api.patch(`/claims/${id}/respond`, { response });
  return res.data.claim;
};
