import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const api = {
  auth: {
    changePassword: (data) => axios.put(`${API_URL}/auth/change-password`, data),
  },
  users: {
    getAll: () => axios.get(`${API_URL}/users`),
    create: (data) => axios.post(`${API_URL}/users`, data),
    delete: (id) => axios.delete(`${API_URL}/users/${id}`),
  },
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
    getAll: (fiscalYear) => axios.get(`${API_URL}/fines`, { params: { fiscal_year: fiscalYear } }),
    create: (data) => axios.post(`${API_URL}/fines`, data),
    update: (id, data) => axios.put(`${API_URL}/fines/${id}`, data),
    delete: (id) => axios.delete(`${API_URL}/fines/${id}`),
  },
  statistics: {
    getByFiscalYear: (fiscalYear) => axios.get(`${API_URL}/statistics`, { params: { fiscal_year: fiscalYear } }),
  },
  fiscalYears: {
    getAll: () => axios.get(`${API_URL}/fiscal-years`),
  },
};