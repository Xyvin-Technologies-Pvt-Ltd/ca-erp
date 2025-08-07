import React, { useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { ROUTES } from "../config/constants";
import InvoicePreview from "../components/InvoicePreview";
import { generateInvoicePDFNew, printInvoice } from "../utils/pdfGenerator";
import { getPublicInvoice } from "../api/finance";
import { toast } from "react-hot-toast";
import { Download, Printer } from "lucide-react";

const InvoicePreviewPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [isDownloading, setIsDownloading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Debug logging
  console.log('InvoicePreviewPage rendered');
  console.log('Current location:', location.pathname);
  console.log('Query params:', location.search);
  
  // Remove authentication check - allow public access to invoice previews
  // const token = localStorage.getItem('auth_token');
  // console.log('Token exists:', !!token);
  
  // if (!token) {
  //   console.log('No token found, redirecting to login');
  //   return <Navigate to={ROUTES.LOGIN} replace />;
  // }

  // Parse invoice data from query parameters
  const invoiceParam = queryParams.get("invoice");
  const invoiceId = queryParams.get("id");
  
  console.log('Invoice param:', invoiceParam);
  console.log('Invoice ID:', invoiceId);
  
  // Load invoice data
  React.useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true);
        console.log('🔄 Starting to load invoice data...');
        console.log('📝 Invoice param:', invoiceParam);
        console.log('📝 Invoice ID:', invoiceId);
        
        if (invoiceParam) {
          // Parse invoice data from URL parameter
          console.log('📝 Parsing invoice data from URL parameter...');
          const parsedInvoice = JSON.parse(decodeURIComponent(invoiceParam));
          console.log('✅ Parsed invoice data:', parsedInvoice);
          setInvoice(parsedInvoice);
        } else if (invoiceId) {
          // Fetch invoice data from API using public endpoint
          console.log('📝 Fetching invoice data for ID:', invoiceId);
          console.log('🌐 Making API call to:', `/finance/public/invoices/${invoiceId}`);
          
          try {
            const response = await getPublicInvoice(invoiceId);
            console.log('✅ API response received:', response);
            console.log('📝 Response data:', response.data);
            setInvoice(response.data);
          } catch (apiError) {
            console.error('❌ API call failed:', apiError);
            
            // If API fails, try to create a preview from the ID
            console.log('🔄 Creating preview invoice from ID...');
            const previewInvoice = {
              id: invoiceId,
              _id: invoiceId,
              invoiceNumber: `PREVIEW-${invoiceId.slice(-6)}`,
              amount: 0,
              total: 0,
              client: { 
                name: "Client Name",
                address: "Client Address",
                city: "City",
                state: "State",
                country: "Country",
                pin: "Postal Code"
              },
              project: { 
                name: "Project Name",
                description: "Project Description"
              },
              issueDate: new Date().toISOString(),
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: "preview",
              paidAmount: 0,
              name: "Project Preview",
              description: "This is a preview invoice for the project",
              notes: "Preview invoice - actual invoice may not exist yet",
              currency: 'INR'
            };
            
            console.log('✅ Created preview invoice:', previewInvoice);
            setInvoice(previewInvoice);
          }
        } else {
          console.log('❌ No invoice data provided');
          setInvoice(null);
        }
      } catch (error) {
        console.error("❌ Error loading invoice data:", error);
        console.error("❌ Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setInvoice(null);
      } finally {
        setLoading(false);
        console.log('✅ Loading completed');
      }
    };

    loadInvoice();
  }, [invoiceParam, invoiceId]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1c6ead] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // If no invoice data, show error
  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h1>
          <p className="text-gray-600 mb-4">The invoice data could not be loaded.</p>
          <button 
            onClick={() => window.close()}
            className="px-4 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-[#155a8a] transition-colors"
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      console.log('Starting PDF download for invoice:', invoice);
      
      // Wait a bit for the DOM to be ready
      setTimeout(async () => {
        try {
          await generateInvoicePDFNew(invoice);
          toast.success('Invoice downloaded successfully!');
        } catch (error) {
          console.error('PDF download failed:', error);
          toast.error('Failed to download invoice. Please try again.');
        } finally {
          setIsDownloading(false);
        }
      }, 500);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice. Please try again.');
      setIsDownloading(false);
    }
  };

  const handlePrint = async () => {
    try {
      console.log('Starting print for invoice:', invoice);
      
      // Wait a bit for the DOM to be ready
      setTimeout(async () => {
        try {
          await printInvoice(invoice);
          toast.success('Print dialog opened successfully!');
        } catch (error) {
          console.error('Print failed:', error);
          toast.error('Failed to print invoice. Please try again.');
          // Fallback to browser print
          window.print();
        }
      }, 500);
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print invoice. Please try again.');
      // Fallback to browser print
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6">
        <InvoicePreview invoice={invoice} isPreview={true} />
      </div>
      
      {/* Action buttons */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-[#155a8a] transition-colors disabled:opacity-50"
          title="Download PDF"
        >
          {isDownloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Downloading...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download PDF
            </>
          )}
        </button>
        
        <button 
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          title="Print Invoice"
        >
          <Printer className="w-4 h-4" />
          Print Invoice
        </button>
        
        <button 
          onClick={() => window.close()}
          className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          title="Close tab"
        >
          ✕ Close
        </button>
        
        {/* <button 
          onClick={() => window.opener ? window.opener.focus() : window.close()}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          title="Back to main app"
        >
          ← Back
        </button> */}
      </div>
    </div>
  );
};

export default InvoicePreviewPage;
