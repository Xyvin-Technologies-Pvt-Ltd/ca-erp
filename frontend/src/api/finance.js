import axios from './axios';

// Record payment for a project
export const recordPayment = async (projectId, paymentData) => {
  try {
    const response = await axios.post(`/finance/projects/${projectId}/payment`, paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get payment history for a project
export const getPaymentHistory = async (projectId) => {
  try {
    const response = await axios.get(`/finance/projects/${projectId}/payments`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get financial summary
export const getFinancialSummary = async () => {
  try {
    const response = await axios.get('/finance/summary');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update project payment status
export const updatePaymentStatus = async (projectId, statusData) => {
  try {
    const response = await axios.put(`/finance/projects/${projectId}/payment-status`, statusData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get all invoices
export const getInvoices = async (params = {}) => {
  try {
    const response = await axios.get('/finance/invoices', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get single invoice
export const getInvoice = async (invoiceId) => {
  try {
    const response = await axios.get(`/finance/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get public invoice (no authentication required)
export const getPublicInvoice = async (invoiceId) => {
  try {
    const response = await axios.get(`/finance/public/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Create invoice
export const createInvoice = async (invoiceData) => {
  try {
    const response = await axios.post('/finance/invoices', invoiceData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update invoice
export const updateInvoice = async (invoiceId, invoiceData) => {
  try {
    const response = await axios.put(`/finance/invoices/${invoiceId}`, invoiceData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete invoice
export const deleteInvoice = async (invoiceId) => {
  try {
    const response = await axios.delete(`/finance/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update invoice status
export const updateInvoiceStatus = async (invoiceId, status) => {
  try {
    const response = await axios.put(`/finance/invoices/${invoiceId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get completed tasks for invoicing
export const getCompletedTasks = async (params = {}) => {
  try {
    const response = await axios.get('/finance/tasks/completed', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get invoice statistics
export const getInvoiceStats = async () => {
  try {
    const response = await axios.get('/finance/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}; 