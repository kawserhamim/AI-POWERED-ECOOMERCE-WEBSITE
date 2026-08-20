// Orders endpoints — match the backend.
import api from './client';

export const createOrder = (data) => api.post('/orders', data);
export const getMyOrders = () => api.get('/orders/mine');
export const getAllOrders = (params = {}) => api.get('/orders', { params });
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const cancelOrder = (id) => api.put(`/orders/${id}/cancel`);
export const updateOrderStatus = (id, status) =>
  api.put(`/orders/${id}/status`, { status });