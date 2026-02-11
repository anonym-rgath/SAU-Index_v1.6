import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const api = {
  members: {
    getAll: () => axios.get(`${API_URL}/members`),
    create: (data) => axios.post(`${API_URL}/members`, data),
    update: (id, data) => axios.put(`${API_URL}/members/${id}`, data),
    delete: (id) => axios.delete(`${API_URL}/members/${id}`),
  },
  fineTypes: {
    getAll: () => axios.get(`${API_URL}/fine-types`),
    create: (data) => axios.post(`${API_URL}/fine-types`, data),
    update: (id, data) => axios.put(`${API_URL}/fine-types/${id}`, data),
    delete: (id) => axios.delete(`${API_URL}/fine-types/${id}`),
  },
  fines: {
    getAll: (year) => axios.get(`${API_URL}/fines`, { params: { year } }),
    create: (data) => axios.post(`${API_URL}/fines`, data),
    update: (id, data) => axios.put(`${API_URL}/fines/${id}`, data),
    delete: (id) => axios.delete(`${API_URL}/fines/${id}`),
  },
  statistics: {
    getByYear: (year) => axios.get(`${API_URL}/statistics/${year}`),
  },
  years: {
    getAll: () => axios.get(`${API_URL}/years`),
  },
};