import React, { useState, useEffect } from "react";
import { 
  Download, 
  Eye, 
  Building2, 
  Calendar, 
  DollarSign,
  FileText,
  MapPin,
  Phone,
  Mail,
  Briefcase
} from "lucide-react";
import { settingsApi } from "../api/settings";

const InvoicePreview = ({ 
  invoice, 
  onDownload, 
  onView, 
  isPreview = false 
}) => {
  const [companySettings, setCompanySettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [clientDetails, setClientDetails] = useState(null);

  // Debug: Log invoice data to see what's being passed
  useEffect(() => {
    console.log('InvoicePreview - Invoice data:', invoice);
    console.log('InvoicePreview - Client data:', invoice?.client);
    console.log('InvoicePreview - Issue Date:', invoice?.issueDate);
    console.log('InvoicePreview - Due Date:', invoice?.dueDate);
    console.log('InvoicePreview - Status:', invoice?.status);
  }, [invoice]);

  // Fetch client details if we have a client ID but no client object
  useEffect(() => {
    const fetchClientDetails = async () => {
      // If we already have client details, don't fetch again
      if (invoice?.client && typeof invoice.client === 'object' && invoice.client.name) {
        setClientDetails(invoice.client);
        return;
      }

      // If we have a client ID but no client object, fetch the client details
      if (invoice?.client?.id || invoice?.client) {
        try {
          // You'll need to import the client API here
          // const response = await clientApi.getClient(invoice.client.id || invoice.client);
          // setClientDetails(response.data);
          
          // For now, use the existing client data or create a default structure
          const clientData = {
            name: invoice?.client?.name || "Client Name",
            address: invoice?.client?.address || "Client Address",
            city: invoice?.client?.city || "City",
            state: invoice?.client?.state || "State",
            country: invoice?.client?.country || "Country",
            pin: invoice?.client?.pin || "Postal Code",
            gstin: invoice?.client?.gstin || "N/A",
            contactPhone: invoice?.client?.contactPhone || "N/A",
            contactEmail: invoice?.client?.contactEmail || "N/A"
          };
          setClientDetails(clientData);
        } catch (error) {
          console.error('Failed to fetch client details:', error);
          // Set default client details
          setClientDetails({
            name: "Client Name",
            address: "Client Address",
            city: "City",
            state: "State",
            country: "Country",
            pin: "Postal Code",
            gstin: "N/A",
            contactPhone: "N/A",
            contactEmail: "N/A"
          });
        }
      } else {
        // Set default client details
        setClientDetails({
          name: "Client Name",
          address: "Client Address",
          city: "City",
          state: "State",
          country: "Country",
          pin: "Postal Code",
          gstin: "N/A",
          contactPhone: "N/A",
          contactEmail: "N/A"
        });
      }
    };

    fetchClientDetails();
  }, [invoice]);

  // Fetch company settings
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        setLoadingSettings(true);
        console.log('Fetching company settings...');
        
        // Check if we have an auth token for API calls
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.log('No auth token found, using default company settings for public access');
          // Use default settings for public access
          setCompanySettings({
            company: {
              name: 'Xyvin Technologies Pvt. Ltd.',
              contactEmail: 'info@xyvin.com',
              phone: '+91 123-456-7890',
              address: {
                street: 'Your Business Address',
                city: 'City',
                state: 'State',
                country: 'Country',
                pin: 'Postal Code'
              },
              currency: 'INR'
            }
          });
          return;
        }
        
        const response = await settingsApi.getCompanyInfo();
        console.log('Company settings response:', response);
        
        // Transform the response to match our expected structure
        const companyData = response.data?.company || {};
        setCompanySettings({
          company: {
            name: companyData.name || 'Xyvin Technologies Pvt. Ltd.',
            contactEmail: companyData.contactEmail || 'info@xyvin.com',
            phone: companyData.phone || '+91 123-456-7890',
            address: companyData.address || {
              street: 'Your Business Address',
              city: 'City',
              state: 'State',
              country: 'Country',
              pin: 'Postal Code'
            },
            currency: companyData.currency || 'INR'
          }
        });
      } catch (error) {
        console.error('Failed to fetch company settings:', error);
        console.log('Using fallback company settings');
        // Use default settings if fetch fails
        setCompanySettings({
          company: {
            name: 'Xyvin Technologies Pvt. Ltd.',
            contactEmail: 'info@xyvin.com',
            phone: '+91 123-456-7890',
            address: {
              street: 'Your Business Address',
              city: 'City',
              state: 'State',
              country: 'Country',
              pin: 'Postal Code'
            },
            currency: 'INR'
          }
        });
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchCompanySettings();
  }, []);

  const formatCurrency = (amount) => {
    const currency = companySettings?.company?.currency || "INR";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      console.error("Date formatting error:", error, "dateString:", dateString);
      return "Invalid Date";
    }
  };

  const calculateSubtotal = () => {
    // For project-based invoices, use the project amount
    return invoice?.amount || 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = invoice?.discount || 0;
    return subtotal - discount;
  };

  // Generate invoice number from project
  const getInvoiceNumber = () => {
    return invoice?.invoiceNumber || `INV-${invoice?.id?.slice(-6) || Date.now().toString().slice(-6)}`;
  };

  // Format company address
  const getCompanyAddress = () => {
    if (!companySettings?.company?.address) return "Your Business Address";
    
    const { street, city, state, country, pin } = companySettings.company.address;
    return `${street || 'Your Business Address'}`;
  };

  const getCompanyLocation = () => {
    if (!companySettings?.company?.address) return "City, State, Country";
    
    const { city, state, country } = companySettings.company.address;
    return `${city || 'City'}, ${state || 'State'}, ${country || 'Country'}`;
  };

  const getCompanyPostalCode = () => {
    return companySettings?.company?.address?.pin || "Postal Code";
  };



  if (loadingSettings) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1c6ead]"></div>
          <span className="ml-3 text-gray-600">Loading company information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-6xl mx-auto" data-invoice-preview>
      {/* Header */}
      <div className="bg-[#1c6ead] text-white p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Project Invoice</h1>
              <p className="text-white/80 text-sm">Professional CA Services</p>
              {invoice?.status === 'preview' && (
                <div className="mt-2 px-3 py-1 bg-yellow-500/20 border border-yellow-300/30 rounded-lg">
                  <p className="text-yellow-200 text-xs font-medium">📋 Preview Invoice</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-left lg:text-right">
            <h2 className="text-lg lg:text-xl font-bold mb-2">{companySettings?.company?.name || "Your Company Name"}</h2>
            <div className="text-white/90 text-sm space-y-1">
              <p>{getCompanyAddress()}</p>
              <p>{getCompanyLocation()}</p>
              <p>{getCompanyPostalCode()}</p>
              <div className="flex items-center gap-2 mt-2">
                <Phone className="w-4 h-4" />
                <span>{companySettings?.company?.phone || "+91 123-456-7890"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{companySettings?.company?.contactEmail || "info@yourcompany.com"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 lg:p-8">
        {/* Invoice Details and Bill To */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Bill To */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#1c6ead]" />
              BILL TO:
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-2">
                {clientDetails?.name || "Client Name"}
              </p>
              <div className="text-gray-700 space-y-1 text-sm">
                <p>{clientDetails?.address || "Client Address"}</p>
                <p>{clientDetails?.city || "City"}, {clientDetails?.state || "State"}</p>
                <p>{clientDetails?.country || "Country"} {clientDetails?.pin || "Postal Code"}</p>
                {clientDetails?.gstin && clientDetails.gstin !== "N/A" && (
                  <p className="font-medium text-gray-900 mt-2">
                    GST: {clientDetails.gstin}
                  </p>
                )}
                {clientDetails?.contactPhone && clientDetails.contactPhone !== "N/A" && (
                  <p className="flex items-center gap-2 mt-2">
                    <Phone className="w-4 h-4 text-[#1c6ead]" />
                    {clientDetails.contactPhone}
                  </p>
                )}
                {clientDetails?.contactEmail && clientDetails.contactEmail !== "N/A" && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#1c6ead]" />
                    {clientDetails.contactEmail}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1c6ead]" />
              INVOICE DETAILS
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Invoice #:</span>
                  <p className="text-gray-900 font-medium">{getInvoiceNumber()}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Date:</span>
                  <p className="text-gray-900 font-medium">{formatDate(invoice?.issueDate || invoice?.invoiceDate || invoice?.createdAt)}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Due Date:</span>
                  <p className="text-gray-900 font-medium">{formatDate(invoice?.dueDate || invoice?.invoiceDate || invoice?.createdAt)}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Client GST:</span>
                  <p className="text-gray-900 font-medium">{clientDetails?.gstin || "N/A"}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    invoice?.status === 'paid' || invoice?.paymentStatus === 'Fully Paid' ? 'bg-green-100 text-green-800' :
                    invoice?.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    invoice?.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    invoice?.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    invoice?.invoiceStatus === 'Created' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(invoice?.status || invoice?.paymentStatus || invoice?.invoiceStatus || 'PENDING')?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Summary Table */}
        <div className="mb-8">
          <div className="bg-gray-50 rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-[#1c6ead] text-white">
                  <tr>
                    <th className="px-4 py-4 text-left font-semibold text-sm whitespace-nowrap">INVOICE #</th>
                    <th className="px-4 py-4 text-left font-semibold text-sm whitespace-nowrap">CLIENT NAME</th>
                    <th className="px-4 py-4 text-left font-semibold text-sm whitespace-nowrap">PROJECT</th>
                    <th className="px-4 py-4 text-center font-semibold text-sm whitespace-nowrap">DATE</th>
                    <th className="px-4 py-4 text-center font-semibold text-sm whitespace-nowrap">DUE DATE</th>
                    <th className="px-4 py-4 text-center font-semibold text-sm whitespace-nowrap">STATUS</th>
                    <th className="px-4 py-4 text-right font-semibold text-sm whitespace-nowrap">TOTAL AMOUNT</th>
                    <th className="px-4 py-4 text-right font-semibold text-sm whitespace-nowrap">RECEIVED</th>
                    <th className="px-4 py-4 text-right font-semibold text-sm whitespace-nowrap">BALANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  <tr className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-4 py-4 text-gray-900 font-medium text-sm">
                      <div className="flex items-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                          {getInvoiceNumber()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-900 text-sm">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          <Building2 className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium">{clientDetails?.name || "Unknown Client"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-700 text-sm">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <Briefcase className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-medium">{invoice?.project?.name || invoice?.name || "Professional Services"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-900 text-sm">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{formatDate(invoice?.issueDate || invoice?.invoiceDate || invoice?.createdAt)}</span>
                        <span className="text-xs text-gray-500">Issue Date</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-900 text-sm">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{formatDate(invoice?.dueDate || invoice?.invoiceDate || invoice?.createdAt)}</span>
                        <span className="text-xs text-gray-500">Due Date</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${
                        invoice?.status === 'paid' || invoice?.paymentStatus === 'Fully Paid' ? 'bg-green-100 text-green-800 border-green-200' :
                        invoice?.status === 'overdue' ? 'bg-red-100 text-red-800 border-red-200' :
                        invoice?.status === 'sent' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        invoice?.status === 'draft' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                        invoice?.invoiceStatus === 'Created' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }`}>
                        {(invoice?.status || invoice?.paymentStatus || invoice?.invoiceStatus || 'PENDING')?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-gray-900 font-medium text-sm">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(invoice?.total || invoice?.amount || 0)}
                        </span>
                        <span className="text-xs text-gray-500">Total Amount</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(invoice?.paidAmount || invoice?.receivedAmount || 0)}
                        </span>
                        <span className="text-xs text-gray-500">Received</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm">
                      <div className="flex flex-col items-end">
                        <span className={`text-lg font-bold ${
                          (invoice?.total || invoice?.amount || 0) - (invoice?.paidAmount || invoice?.receivedAmount || 0) > 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {formatCurrency((invoice?.total || invoice?.amount || 0) - (invoice?.paidAmount || invoice?.receivedAmount || 0))}
                        </span>
                        <span className="text-xs text-gray-500">Balance</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notes and Totals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Notes */}
          <div className="md:col-span-2">
            {/* <h3 className="text-lg font-bold text-gray-900 mb-4">NOTES:</h3>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-gray-700 text-sm">
                {invoice?.notes || "Thank you for choosing our professional CA services. Please make payment by the due date. For any queries, please contact us."}
              </p>
            </div> */}
          </div>

          {/* Totals */}
          <div>
            <div className="bg-[#1c6ead] text-white rounded-lg p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/90">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                </div>
                {invoice?.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/90">Discount:</span>
                    <span className="font-medium">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="border-t border-white/20 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">TOTAL:</span>
                    <span className="text-lg font-bold">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-6 text-center">
        <p className="text-gray-600 text-sm">
          {/* Powered by {companySettings?.company?.name || "Your Company Name"} */}
          Powered by Xyvin Technologies Pvt. Ltd.
        </p>
        <p className="text-gray-500 text-xs mt-1">
          This invoice was generated with the help of ERP System
        </p>
      </div>
    </div>
  );
};

export default InvoicePreview; 