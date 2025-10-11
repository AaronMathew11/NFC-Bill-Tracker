import axios from 'axios';

const API_BASE = 'http://localhost:5001/api'; // if your backend is running locally

// Add new bill
export const addBill = async (billData) => {
  const res = await axios.post(`${API_BASE}/bills`, billData);
  return res.data;
};

// Get all bills (admin)
export const getAllBills = async () => {
  const res = await axios.get(`${API_BASE}/bills`);
  return res.data;
};

// Update bill status (approve/reject)
export const updateBillStatus = async (id, status) => {
  const res = await axios.put(`${API_BASE}/bills/${id}`, { status });
  return res.data;
};

// Get user's bills
export const getUserBills = async (userId) => {
  const res = await axios.get(`${API_BASE}/bills/user/${userId}`);
  return res.data;
};
