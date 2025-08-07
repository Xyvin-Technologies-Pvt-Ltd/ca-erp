import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateInvoicePDFNew = async (invoice, targetElement = null) => {
  try {
    // Select the InvoicePreview element - use provided element or find by data attribute
    const element = targetElement || document.querySelector('[data-invoice-preview]');
    if (!element) {
      throw new Error('Invoice preview element not found');
    }

    // Create a clone of the element to avoid modifying the original
    const clonedElement = element.cloneNode(true);
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    document.body.appendChild(clonedElement);

    // Remove problematic CSS classes and styles that cause oklab/oklch issues
    const allElements = clonedElement.querySelectorAll('*');
    allElements.forEach(el => {
      // Skip SVG elements as they don't support className property
      if (el.tagName === 'SVG' || el.tagName === 'PATH' || el.tagName === 'CIRCLE' || el.tagName === 'RECT') {
        return;
      }

      // Remove Tailwind classes that might contain problematic colors
      const classesToRemove = [
        'bg-gradient-to-br', 'bg-gradient-to-r', 'bg-gradient-to-l',
        'from-blue-50', 'to-indigo-50', 'via-white',
        'text-blue-600', 'text-green-600', 'text-red-600',
        'bg-blue-100', 'bg-green-100', 'bg-red-100',
        'border-blue-200', 'border-green-200', 'border-red-200',
        'bg-[#1c6ead]', 'text-white', 'bg-white/20', 'bg-white/30'
      ];
      
      classesToRemove.forEach(className => {
        if (el.classList && el.classList.contains(className)) {
          el.classList.remove(className);
        }
      });

      // Set safe fallback styles
      const computedStyle = window.getComputedStyle(el);
      if (computedStyle.backgroundColor && (computedStyle.backgroundColor.includes('oklab') || computedStyle.backgroundColor.includes('oklch'))) {
        el.style.backgroundColor = '#ffffff';
      }
      if (computedStyle.color && (computedStyle.color.includes('oklab') || computedStyle.color.includes('oklch'))) {
        el.style.color = '#000000';
      }
      if (computedStyle.borderColor && (computedStyle.borderColor.includes('oklab') || computedStyle.borderColor.includes('oklch'))) {
        el.style.borderColor = '#d1d5db';
      }
    });

    // Capture the element as a canvas
    const canvas = await html2canvas(clonedElement, {
      scale: 2, // Improve resolution
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: true,
      // Ignore elements that might still have problematic styles
      ignoreElements: (element) => {
        const style = window.getComputedStyle(element);
        return style.backgroundColor?.includes('oklab') || 
               style.backgroundColor?.includes('oklch') ||
               style.color?.includes('oklab') ||
               style.color?.includes('oklch') ||
               style.borderColor?.includes('oklab') ||
               style.borderColor?.includes('oklch');
      }
    });

    // Clean up the cloned element
    document.body.removeChild(clonedElement);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`invoice-${invoice?.invoiceNumber || 'INV-' + Date.now().toString().slice(-6)}.pdf`);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // If html2canvas fails, try with even more aggressive CSS removal
    if (error.message.includes('oklab') || error.message.includes('oklch') || error.message.includes('color function')) {
      console.log('Trying with aggressive CSS removal...');
      return await generateWithAggressiveCSSRemoval(invoice, targetElement);
    }
    
    throw error;
  }
};

// More aggressive CSS removal method
const generateWithAggressiveCSSRemoval = async (invoice, targetElement = null) => {
  try {
    const element = targetElement || document.querySelector('[data-invoice-preview]');
    if (!element) {
      throw new Error('Invoice preview element not found');
    }

    // Create a completely stripped version
    const strippedElement = element.cloneNode(true);
    strippedElement.style.position = 'absolute';
    strippedElement.style.left = '-9999px';
    strippedElement.style.top = '0';
    strippedElement.style.backgroundColor = '#ffffff';
    document.body.appendChild(strippedElement);

    // Remove all potentially problematic styles
    const allElements = strippedElement.querySelectorAll('*');
    allElements.forEach(el => {
      // Skip SVG elements
      if (el.tagName === 'SVG' || el.tagName === 'PATH' || el.tagName === 'CIRCLE' || el.tagName === 'RECT') {
        return;
      }

      // Remove all classes safely
      if (el.classList) {
        el.className = '';
      }
      
      // Set basic safe styles
      el.style.backgroundColor = '#ffffff';
      el.style.color = '#000000';
      el.style.borderColor = '#d1d5db';
      el.style.borderStyle = 'solid';
      el.style.borderWidth = '1px';
      
      // Keep only essential styles
      if (el.tagName === 'TABLE') {
        el.style.borderCollapse = 'collapse';
        el.style.width = '100%';
      }
      if (el.tagName === 'TH' || el.tagName === 'TD') {
        el.style.padding = '8px';
        el.style.border = '1px solid #d1d5db';
      }
    });

    const canvas = await html2canvas(strippedElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: true
    });

    document.body.removeChild(strippedElement);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`invoice-${invoice?.invoiceNumber || 'INV-' + Date.now().toString().slice(-6)}.pdf`);

    return true;
  } catch (error) {
    console.error('Aggressive CSS removal also failed:', error);
    throw error;
  }
};

export const printInvoice = async (invoice) => {
  // Similar logic to generate PDF, then trigger print
  window.print();
};

export const testPDFLibraries = () => {
  return typeof jsPDF !== 'undefined' && typeof html2canvas !== 'undefined';
};

export const debugInvoiceElements = () => {
  console.log('Invoice elements:', document.querySelector('[data-invoice-preview]'));
};