import axios from './axios';

export const settingsApi = {
  // Get all settings (requires superadmin)
  getSettings: async () => {
    const response = await axios.get('/settings');
    return response.data;
  },

  // Get company info (all authenticated users)
  getCompanyInfo: async () => {
    const response = await axios.get('/settings/company-info');
    return response.data;
  },

  // Get company info for invoices (all authenticated users)
  getCompanyInvoiceInfo: async () => {
    const response = await axios.get('/settings/company-invoice-info');
    return response.data;
  },

  // Update settings (requires superadmin)
  updateSettings: async (settingsData) => {
    const response = await axios.put('/settings', settingsData);
    return response.data;
  },
}; 