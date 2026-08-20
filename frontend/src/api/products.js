// Products + Reviews API calls.
import api from './client';

export const getProducts = (params = {}) => api.get('/products', { params });
export const getFeaturedProducts = () => api.get('/products/featured');
export const getCategories = () => api.get('/products/categories');
export const getProductById = (id) => api.get(`/products/${id}`);
export const getProductsByIds = (ids) =>
  api.get('/products/by-ids', { params: { ids: ids.join(',') } });

// Admin product CRUD
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Reviews
export const getReviews = (productId) =>
  api.get(`/products/${productId}/reviews`);
export const createReview = (productId, data) =>
  api.post(`/products/${productId}/reviews`, data);
export const updateReview = (productId, reviewId, data) =>
  api.put(`/products/${productId}/reviews/${reviewId}`, data);
export const deleteReview = (productId, reviewId) =>
  api.delete(`/products/${productId}/reviews/${reviewId}`);