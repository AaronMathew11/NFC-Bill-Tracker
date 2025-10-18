import axios from 'axios';
import { withRetry, handleApiError } from '../utils/apiUtils';

// Use local API in development, deployed API in production
const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'  // Local development
  : 'https://api-lyymlpizsa-uc.a.run.app/api'; // Firebase Functions deployment

console.log('API_BASE:', API_BASE);

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 second timeout

// Add axios interceptor for better error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorInfo = handleApiError(error);
    console.error('API call failed:', errorInfo);
    return Promise.reject(error);
  }
);

// Add new bill (using upload-bill endpoint)
export const addBill = async (billData) => {
  const res = await axios.post(`${API_BASE}/upload-bill`, billData);
  return res.data;
};

// Get all bills (admin) - using all-bills-with-stats for extra data
export const getAllBills = async () => {
  return withRetry(async () => {
    const res = await axios.get(`${API_BASE}/all-bills-with-stats`);
    return res.data;
  });
};

// Update bill status (approve/reject/return)
export const updateBillStatus = async (id, statusData) => {
  const res = await axios.patch(`${API_BASE}/update-bill-status/${id}`, statusData);
  return res.data;
};

// Get user's bills
export const getUserBills = async (userId) => {
  return withRetry(async () => {
    const res = await axios.get(`${API_BASE}/user-bills/${userId}`);
    return res.data;
  });
};

// Additional API calls to match backend routes
export const getUserReturnedBills = async (userId) => {
  const res = await axios.get(`${API_BASE}/user-returned-bills/${userId}`);
  return res.data;
};

export const updateBillContent = async (billId, billData) => {
  const res = await axios.patch(`${API_BASE}/update-bill/${billId}`, billData);
  return res.data;
};

export const deleteBill = async (billId) => {
  const res = await axios.delete(`${API_BASE}/delete-bill/${billId}`);
  return res.data;
};

export const checkDuplicate = async (billData) => {
  const res = await axios.post(`${API_BASE}/check-duplicate`, billData);
  return res.data;
};

export const addDirectPayment = async (paymentData) => {
  const res = await axios.post(`${API_BASE}/direct-payment`, paymentData);
  return res.data;
};

export const getLedger = async () => {
  const res = await axios.get(`${API_BASE}/ledger`);
  return res.data;
};

export const getEventLogs = async () => {
  const res = await axios.get(`${API_BASE}/event-logs`);
  return res.data;
};

export const getUsers = async () => {
  const res = await axios.get(`${API_BASE}/users`);
  return res.data;
};
