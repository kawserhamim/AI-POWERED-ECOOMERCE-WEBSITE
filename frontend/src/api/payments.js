// Payments endpoints — match the backend.
import api from './client';

export const createPayment = (orderId, method = 'sslcommerz') =>
  api.post('/payments', { orderId, method });
export const getMyPayments = () => api.get('/payments/mine');
export const getAllPayments = (params = {}) => api.get('/payments', { params });
export const getPaymentById = (id) => api.get(`/payments/${id}`);
export const refundPayment = (id) => api.put(`/payments/${id}/refund`);