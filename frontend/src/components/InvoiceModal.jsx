import React, { useState, useEffect } from "react";
import InvoicePreview from "./InvoicePreview";
import { generateInvoicePDFNew, printInvoice, testPDFLibraries, debugInvoiceElements } from "../utils/pdfGenerator";
import { toast } from "react-hot-toast";
import { 
  Download, 
  Eye, 
  X, 
  Printer,
  Share2,
  Receipt
} from "lucide-react";

const InvoiceModal = ({ 
  isOpen, 
  onClose, 
  invoice, 
  onDownload, 
  onView,
  onPrint,
  onCreateInvoice // Add this prop for invoice creation
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Handle click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
      
      // Test PDF libraries when modal opens
      console.log('Modal opened, testing PDF libraries...');
      const librariesOk = testPDFLibraries();
      if (!librariesOk) {
        console.error('PDF libraries not properly loaded!');
        toast.error('PDF generation libraries not loaded. Please refresh the page.');
      }
      
      // Debug invoice elements
      setTimeout(() => {
        console.log('Debugging invoice elements...');
        const invoicePreviewElement = document.querySelector('[data-invoice-preview]');
        console.log('Invoice preview element found:', invoicePreviewElement);
        debugInvoiceElements();
      }, 500);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleView = () => {
    if (onView) {
      onView(invoice);
    }

    // Open invoice preview in new tab like a hyperlink
    try {
      console.log('Opening invoice preview for:', invoice);
      
      // Create a comprehensive invoice object with all necessary data
      const fullInvoice = {
        id: invoice?.id || invoice?._id,
        invoiceNumber: invoice?.invoiceNumber,
        amount: invoice?.amount || invoice?.cost,
        client: invoice?.client,
        project: invoice?.project,
        issueDate: invoice?.issueDate || invoice?.invoiceDate,
        dueDate: invoice?.dueDate,
        status: invoice?.status || invoice?.invoiceStatus,
        paidAmount: invoice?.paidAmount || invoice?.receivedAmount,
        total: invoice?.total || invoice?.amount || invoice?.cost,
        name: invoice?.name,
        description: invoice?.description,
        notes: invoice?.notes,
        currency: invoice?.currency || 'INR'
      };
      
      const invoiceJson = JSON.stringify(fullInvoice);
      console.log('Invoice JSON length:', invoiceJson.length);
      
      // Check if URL would be too long (browsers typically limit to ~2000 chars)
      const previewUrl = `/invoice-preview?invoice=${encodeURIComponent(invoiceJson)}`;
      console.log('Full URL length:', previewUrl.length);
      
      if (previewUrl.length > 2000) {
        console.log('URL too long, using fallback with minimal data');
        const minimalInvoice = {
          id: invoice?.id || invoice?._id,
          invoiceNumber: invoice?.invoiceNumber,
          amount: invoice?.amount || invoice?.cost,
          client: invoice?.client,
          project: invoice?.project
        };
        const fallbackUrl = `/invoice-preview?invoice=${encodeURIComponent(JSON.stringify(minimalInvoice))}`;
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(previewUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error opening invoice preview:', error);
      // Fallback: open with just the ID
      const fallbackUrl = `/invoice-preview?id=${invoice?.id || invoice?._id}`;
      console.log('Opening fallback URL:', fallbackUrl);
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  };

const handleCopyLink = (invoice) => {
  const link = `/invoice-preview?invoice=${encodeURIComponent(
    JSON.stringify({
      id: invoice?.id || invoice?._id,
      invoiceNumber: invoice?.invoiceNumber,
      amount: invoice?.amount || invoice?.cost,
      client: invoice?.client,
      project: invoice?.project,
      issueDate: invoice?.issueDate || invoice?.invoiceDate,
      dueDate: invoice?.dueDate,
      status: invoice?.status || invoice?.invoiceStatus,
      paidAmount: invoice?.paidAmount || invoice?.receivedAmount,
      total: invoice?.total || invoice?.amount || invoice?.cost,
      name: invoice?.name,
      description: invoice?.description,
      notes: invoice?.notes,
      currency: invoice?.currency || "INR",
    })
  )}`;

  navigator.clipboard
    .writeText(window.location.origin + link)
    .then(() => {
      alert("Link copied to clipboard ✅");
    })
    .catch((err) => {
      console.error("Failed to copy link:", err);
    });
};

  const handlePrint = async () => {
    try {
      await printInvoice(invoice);
      if (onPrint) {
        onPrint(invoice);
      }
      toast.success('Invoice printed successfully!');
    } catch (error) {
      console.error('Print failed:', error);
      toast.error('Failed to print invoice. Please try again.');
      if (onPrint) {
        onPrint(invoice);
      } else {
        window.print();
      }
    }
  };

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      console.log('Starting PDF download for invoice:', invoice);
      
      // Wait a bit for the DOM to be ready and the invoice preview to render
      setTimeout(async () => {
        try {
          // Find the invoice preview element within the modal
          const invoicePreviewElement = document.querySelector('[data-invoice-preview]');
          if (!invoicePreviewElement) {
            throw new Error('Invoice preview element not found in modal');
          }
          
          // Generate PDF from the invoice preview element
          
          const response = await generateInvoicePDFNew(invoice, invoicePreviewElement);
          toast.success('Invoice downloaded successfully!');
          
          if (onDownload) {
            onDownload(invoice);
          }
        } catch (error) {
          console.error('PDF download failed:', error);
          toast.error('Failed to download invoice. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }, 1000); // Give more time for the invoice preview to fully render
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice. Please try again.');
      setIsLoading(false);
    }
  };

  if (!isOpen || !invoice) return null;

  // Generate invoice number from project
  const getInvoiceNumber = () => {
    return invoice?.invoiceNumber || `INV-${invoice?.id?.slice(-6) || Date.now().toString().slice(-6)}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300 p-4 no-print"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 no-print"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1c6ead] text-white p-6 border-b border-blue-200 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Invoice Preview</h3>
                <p className="text-white/80 text-sm">Invoice #{getInvoiceNumber()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 no-print">
              {/* Action Buttons */}
              <button
                onClick={handleView}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200"
                title="Open invoice in new tab"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <button
  onClick={() => handleCopyLink(invoice)}
  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200"
  title="Click to copy link"
>
  <Share2 className="w-4 h-4" />
  Copy Link
</button>
              {/* <a
                href={`/invoice-preview?invoice=${encodeURIComponent(JSON.stringify({
                  id: invoice?.id || invoice?._id,
                  invoiceNumber: invoice?.invoiceNumber,
                  amount: invoice?.amount || invoice?.cost,
                  client: invoice?.client,
                  project: invoice?.project,
                  issueDate: invoice?.issueDate || invoice?.invoiceDate,
                  dueDate: invoice?.dueDate,
                  status: invoice?.status || invoice?.invoiceStatus,
                  paidAmount: invoice?.paidAmount || invoice?.receivedAmount,
                  total: invoice?.total || invoice?.amount || invoice?.cost,
                  name: invoice?.name,
                  description: invoice?.description,
                  notes: invoice?.notes,
                  currency: invoice?.currency || 'INR'
                }))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200"
                title="Right-click to copy link or open in new tab"
              >
                <Share2 className="w-4 h-4" />
                Link
              </a> */}
              
             
              
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              
              <button
                onClick={handleDownload}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200 disabled:opacity-50"
                type="button"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download
                  </>
                )}
              </button>
              
              {/* Create Invoice Button - only show for new invoices */}
              {invoice?.id?.startsWith('temp-') && onCreateInvoice && (
                <button
                  onClick={onCreateInvoice}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  type="button"
                >
                  <Receipt className="w-4 h-4" />
                  Create Invoice
                </button>
              )}
              
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] no-print">
          <div className="p-6" data-invoice-preview="true">
            <InvoicePreview 
              invoice={invoice} 
              onDownload={onDownload}
              onView={onView}
              isPreview={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;