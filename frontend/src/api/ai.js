// AI smart-search / chatbot endpoint — matches POST /api/smart-search
import api from './client';

export const smartSearch = (input) => api.post('/smart-search', { input });
