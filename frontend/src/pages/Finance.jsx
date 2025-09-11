import { useState, useEffect } from "react";
import {
  fetchCompletedProjectsForInvoicing,
  markProjectAsInvoiced,
} from "../api/projects";
import {
  getFinancialSummary,
  recordPayment,
  getInvoices,
  createInvoice,
  uploadReceipt,
  downloadReceipt,
} from "../api/finance";
import { Link } from "react-router-dom";
import PaymentModal from "../components/PaymentModal";
import InvoiceModal from "../components/InvoiceModal";
import InvoicePreview from "../components/InvoicePreview";
import { generateInvoicePDFNew } from "../utils/pdfGenerator";
import { toast } from "react-hot-toast";
import {
  CreditCard,
  FileText,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  Download,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building2,
  Briefcase,
  TrendingUp,
  Receipt,
  Plus,
  Wallet,
  BarChart3,
  Share2,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  Target,
  DollarSign,
  UserCheck,
  Upload,
} from "lucide-react";

const statusColors = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
  review: "bg-purple-50 text-purple-700 border-purple-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  invoiced: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-50 text-gray-700 border-gray-200",
};

// const priorityColors = {
//   high: "bg-red-50 text-red-700 border-red-200",
//   medium: "bg-orange-50 text-orange-700 border-orange-200",
//   low: "bg-green-50 text-green-700 border-green-200",
// };

const invoiceStatusColors = {
  "Not Created": "bg-amber-50 text-amber-700 border-amber-200",
  Created: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const paymentStatusColors = {
  "Not Paid": "bg-red-50 text-red-700 border-red-200",
  "Partially Paid": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Fully Paid": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const Finance = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    client: "",
    selectedProjectIds: [],
  });
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProjectForPayment, setSelectedProjectForPayment] =
    useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [financialSummary, setFinancialSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [showInvoiceTable, setShowInvoiceTable] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const [filters, setFilters] = useState({
    project: "",
    client: "",
    paymentStatus: "",
    invoiceStatus: "",
    priority: "",
    manager: "",
    startDate: "",
    endDate: "",
    amountRange: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [paginations, setPaginations] = useState({
    page: 1,
    total: 0,
    limit: 10,
  });
  const [totalPage, setTotalPage] = useState(0);
  const [pages, setPages] = useState([]);

  const [receiptUploadProject, setReceiptUploadProject] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptUploading, setReceiptUploading] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchCompletedProjectsForInvoicing({
        page: currentPage,
        limit: paginations.limit,
      });
      const transformed = data.projects.map((project) => ({
        ...project,
        cost: project.amount || 0,
        receivedAmount: project.receivedAmount || 0,
        balanceAmount: project.balanceAmount || 0,
        paymentStatus: project.paymentStatus || "Not Paid",
      }));
      setProjects(transformed);
      setPaginations({
        page: data.page || currentPage,
        total: data.total || 0,
        limit: paginations.limit,
      });

      // Calculate total pages
      const totalPages = Math.ceil(data.total / paginations.limit);
      setTotalPage(totalPages);

      // Generate page numbers array
      const pageNumbers = [];
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      setPages(pageNumbers);
    } catch (err) {
      console.error("Failed to fetch completed projects:", err);
      setError("Failed to load completed projects. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialSummary = async () => {
    try {
      const summary = await getFinancialSummary();
      console.log(summary);
      setFinancialSummary(summary.data);
    } catch (err) {
      console.error("Failed to load financial summary:", err);
    }
  };

  const loadInvoices = async () => {
    try {
      const invoiceData = await getInvoices();
      setInvoices(invoiceData.data);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    }
  };

  useEffect(() => {
    loadProjects();
    loadFinancialSummary();
    loadInvoices();
  }, [currentPage]);

  const handlePageChanges = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleProjectSelection = (id) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map((p) => p.id));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      project: "",
      client: "",
      paymentStatus: "",
      invoiceStatus: "",
      priority: "",
      manager: "",
      startDate: "",
      endDate: "",
      amountRange: "",
    });
  };

  const openInvoiceModal = () => {
    if (!selectedProjects.length) {
      alert("Please select at least one project to invoice.");
      return;
    }

    // Get selected projects data
    const selectedProjectsData = projects.filter((p) =>
      selectedProjects.includes(p.id)
    );

    // Create invoice data for the modal
    const invoiceForModal = {
      id: `temp-${Date.now()}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      amount: selectedProjectsData.reduce(
        (sum, p) => sum + Number(p.cost || p.amount || 0),
        0
      ),
      client: selectedProjectsData[0]?.client,
      project: selectedProjectsData[0], // Use first project as main project
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 30 days from now
      status: "draft",
      paidAmount: selectedProjectsData.reduce(
        (sum, p) => sum + Number(p.receivedAmount || 0),
        0
      ),
      total: selectedProjectsData.reduce(
        (sum, p) => sum + Number(p.cost || p.amount || 0),
        0
      ),
      name:
        selectedProjectsData.length === 1
          ? selectedProjectsData[0].name
          : `${selectedProjectsData.length} Projects`,
      description:
        selectedProjectsData.length === 1
          ? selectedProjectsData[0].description
          : `Invoice for ${selectedProjectsData.length} projects`,
      notes: `Invoice created for ${selectedProjectsData.length} project(s)`,
      currency: "INR",
      selectedProjects: selectedProjectsData, // Store all selected projects
    };

    setSelectedInvoice(invoiceForModal);
    setShowInvoiceModal(true);
  };

  const openPaymentModal = (project) => {
    setSelectedProjectForPayment(project);
    setShowPaymentModal(true);
  };

  const viewInvoiceModal = (project) => {
    setSelectedInvoice(project);
    setShowInvoiceModal(true);
  };

  const handleInvoiceDownload = async (project) => {
    try {
      console.log("Starting PDF download for project:", project);

      // Create invoice data structure
      const invoiceData = {
        id: project._id,
        invoiceNumber: project.invoiceNumber,
        amount: project.cost,
        client: project.client,
        project: project,
        issueDate: project.invoiceDate,
        dueDate: project.dueDate,
        status: project.invoiceStatus,
        paidAmount: project.receivedAmount,
        total: project.cost,
        name: project.name,
        description: project.description,
        notes: project.notes,
        currency: project.currency || "INR",
      };

      // Create a temporary container for PDF generation
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      tempContainer.style.backgroundColor = "#ffffff";
      tempContainer.setAttribute("data-invoice-preview", "true");
      document.body.appendChild(tempContainer);

      try {
        // Create a React root and render the InvoicePreview component
        const { createRoot } = await import("react-dom/client");
        const root = createRoot(tempContainer);

        // Render the InvoicePreview component
        root.render(
          <div style={{ padding: "20px", backgroundColor: "#ffffff" }}>
            <InvoicePreview invoice={invoiceData} isPreview={true} />
          </div>
        );

        // Wait for the component to render
        setTimeout(async () => {
          try {
            // Generate PDF from the temporary element
            await generateInvoicePDFNew(invoiceData, tempContainer);
            toast.success("Invoice downloaded successfully!");
          } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("Failed to download invoice. Please try again.");
          } finally {
            // Clean up
            root.unmount();
            document.body.removeChild(tempContainer);
          }
        }, 1000); // Give time for the component to render
      } catch (error) {
        console.error("PDF download failed:", error);
        toast.error("Failed to download invoice. Please try again.");
        // Clean up on error
        if (tempContainer.parentNode) {
          document.body.removeChild(tempContainer);
        }
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download invoice. Please try again.");
    }
  };

  const handleInvoiceView = (project) => {
    // Open invoice preview in new tab like a hyperlink
    try {
      console.log("Opening invoice preview for project:", project);

      const invoiceData = {
        id: project._id,
        invoiceNumber: project.invoiceNumber,
        amount: project.cost,
        client: project.client,
        project: project,
        issueDate: project.invoiceDate,
        dueDate: project.dueDate,
        status: project.invoiceStatus,
        paidAmount: project.receivedAmount,
        total: project.cost,
        name: project.name,
        description: project.description,
        notes: project.notes,
        currency: project.currency || "INR",
      };

      console.log("Invoice data being passed:", invoiceData);
      const previewUrl = `/invoice-preview?invoice=${encodeURIComponent(
        JSON.stringify(invoiceData)
      )}`;
      console.log("Opening URL:", previewUrl);
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening invoice preview:", error);
      // Fallback: open with just the ID
      const fallbackUrl = `/invoice-preview?id=${project._id}`;
      console.log("Opening fallback URL:", fallbackUrl);
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleInvoicePrint = (project) => {
    // Implement print logic for project invoice
    console.log("Printing invoice for project:", project.name);
  };

  const handlePaymentRecorded = (paymentData) => {
    // Update the project in the list with new payment data
    setProjects((prev) =>
      prev.map((project) =>
        project._id === paymentData.project._id
          ? { ...project, ...paymentData.project }
          : project
      )
    );

    setSuccessMessage(
      `Payment of ₹${paymentData.payment.amount.toLocaleString(
        "en-IN"
      )} recorded successfully for ${paymentData.project.name}`
    );
    setShowSuccessMessage(true);

    // Reload financial summary
    loadFinancialSummary();

    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const handleCreateInvoiceFromModal = async () => {
    try {
      setLoading(true);

      if (!selectedInvoice) {
        toast.error("No invoice data available");
        return;
      }

      // Get selected projects data
      const selectedProjectsData =
        selectedInvoice.selectedProjects ||
        projects.filter((p) => selectedProjects.includes(p.id));

      // Create invoice data for the backend
      const invoiceDataToSend = {
        client:
          selectedProjectsData[0]?.client?._id ||
          selectedProjectsData[0]?.client,
        projects: selectedProjectsData.map((project) => ({
          projectId: project._id || project.id,
          name: project.name,
          amount: project.cost || project.amount,
          description: project.description,
        })),
        issueDate: selectedInvoice.issueDate,
        dueDate: selectedInvoice.dueDate,
        invoiceNumber: selectedInvoice.invoiceNumber,
        status: "draft",
        currency: selectedInvoice.currency || "INR",
        taxRate: 0,
        discount: 0,
        notes:
          selectedInvoice.notes ||
          `Invoice for ${selectedProjectsData.length} project(s)`,
        terms: "Payment due within 30 days",
      };

      console.log(
        "Creating invoice with data:  ##################",
        invoiceDataToSend
      );

      // Create the invoice using the finance API
      const createdInvoice = await createInvoice(invoiceDataToSend);
      console.log("Invoice created:", createdInvoice);

      // The backend will automatically update project invoice status
      // No need to manually call markProjectAsInvoiced since the backend handles it

      await loadProjects();
      setSelectedProjects([]);
      setSuccessMessage(
        `Invoice ${selectedInvoice.invoiceNumber} created successfully!`
      );
      setShowSuccessMessage(true);
      setShowInvoiceModal(false);

      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (err) {
      console.error("Invoice creation failed:", err);
      toast.error("Failed to create invoice. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      setLoading(true);

      // Get selected projects data
      const selectedProjectsData =
        selectedInvoice.selectedProjects ||
        projects.filter((p) => selectedProjects.includes(p.id));

      if (!selectedProjectsData || selectedProjectsData.length === 0) {
        toast.error("No projects selected for invoice");
        return;
      }

      // Create invoice data for the backend
      const invoiceDataToSend = {
        client:
          selectedProjectsData[0]?.client?._id ||
          selectedProjectsData[0]?.client,
        projects: selectedProjectsData.map((project) => {
          const projectId = project._id || project.id;
          if (!projectId) {
            console.error("Missing project ID for project:", project);
            throw new Error("Invalid project data: Missing project ID");
          }
          return {
            projectId,
            name: project.name || "Untitled Project",
            amount: Number(project.cost || project.amount || 0),
            description:
              project.description || project.name || "No description available",
          };
        }),
        issueDate: invoiceData.invoiceDate,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 30 days from now
        invoiceNumber: invoiceData.invoiceNumber,
        status: "draft",
        currency: "INR",
        taxRate: 0,
        discount: 0,
        notes: `Invoice for ${selectedProjectsData.length} project(s)`,
        terms: "Payment due within 30 days",
      };

      console.log("Creating invoice with data:", invoiceDataToSend);

      // Create the invoice using the finance API
      const createdInvoice = await createInvoice(invoiceDataToSend);
      console.log("Invoice created:", createdInvoice);

      // The backend will automatically update project invoice status
      // No need to manually call markProjectAsInvoiced since the backend handles it

      await loadProjects();
      setSelectedProjects([]);
      setSuccessMessage(
        `Invoice ${invoiceData.invoiceNumber} created successfully for ${invoiceData.client}.`
      );
      setShowSuccessMessage(true);
      setShowInvoiceModal(false);

      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (err) {
      console.error("Invoice creation failed:", err);
      setError("Failed to create invoice. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (p.status !== "completed") return false;
    if (filters.project && p.id !== filters.project) return false;
    if (filters.client && p.client?.id !== filters.client) return false;
    if (filters.paymentStatus && p.paymentStatus !== filters.paymentStatus)
      return false;
    if (filters.invoiceStatus && p.invoiceStatus !== filters.invoiceStatus)
      return false;
    if (filters.priority && p.priority !== filters.priority) return false;
    if (filters.manager && p.manager?.id !== filters.manager) return false;

    // Date range filtering
    if (filters.startDate && p.startDate) {
      const startDate = new Date(filters.startDate);
      const projectStartDate = new Date(p.startDate);
      if (projectStartDate < startDate) return false;
    }
    if (filters.endDate && p.dueDate) {
      const endDate = new Date(filters.endDate);
      const projectDueDate = new Date(p.dueDate);
      if (projectDueDate > endDate) return false;
    }

    // Amount range filtering
    if (filters.amountRange) {
      const amount = Number(p.cost || p.amount || 0);
      switch (filters.amountRange) {
        case "low":
          if (amount >= 50000) return false;
          break;
        case "medium":
          if (amount < 50000 || amount >= 200000) return false;
          break;
        case "high":
          if (amount < 200000) return false;
          break;
        default:
          break;
      }
    }

    return true;
  });
  console.log(filteredProjects);
  const client = Array.from(
    new Map(
      projects.map((p) => [
        p.client?.id,
        {
          id: p.client?.id,
          name: p.client?.name,
        },
      ])
    ).values()
  ).filter((c) => c.id && c.name);

  const managers = Array.from(
    new Map(
      projects.map((p) => [
        p.manager?.id,
        {
          id: p.manager?.id,
          name: p.manager?.name,
        },
      ])
    ).values()
  ).filter((m) => m.id && m.name);

  const selectedProjectsData = projects.filter((p) =>
    selectedProjects.includes(p.id)
  );
  const totalAmount = selectedProjectsData.reduce(
    (sum, p) => sum + Number(p.cost || 0),
    0
  );
  const totalReceived = selectedProjectsData.reduce(
    (sum, p) => sum + Number(p.receivedAmount || 0),
    0
  );
  const totalBalance = selectedProjectsData.reduce(
    (sum, p) => sum + Number(p.balanceAmount || 0),
    0
  );
  const totalHours = selectedProjectsData.reduce(
    (sum, p) => sum + Number(p.actualHours || p.estimatedHours || 0),
    0
  );

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-ping mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading financial data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={loadProjects}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1c6ead] text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const toggleRowExpansion = (projectId) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const openReceiptModal = (project) => {
    setReceiptUploadProject(project);
    setShowReceiptModal(true);
    setReceiptFile(null);
  };

  const handleReceiptFileChange = (e) => {
    setReceiptFile(e.target.files[0]);
  };

  const handleReceiptUpload = async () => {
    if (!receiptFile || !receiptUploadProject) return;
    setReceiptUploading(true);
    try {
      console.log("Uploading receipt for project:", receiptFile);

      await uploadReceipt(
        receiptUploadProject._id || receiptUploadProject.id,
        receiptFile
      );
      setSuccessMessage("Receipt uploaded successfully!");
      setShowSuccessMessage(true);
      setShowReceiptModal(false);
      loadProjects();
    } catch (err) {
      setError("Failed to upload receipt. Please try again.");
    } finally {
      setReceiptUploading(false);
    }
  };

  const handleReceiptDownload = async (project) => {
    try {
      const blob = await downloadReceipt(project._id || project.id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const filename = project.receipts
        ? project.receipts.split("/").pop()
        : `receipt-${project.name}-${Date.now()}.pdf`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download receipt. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#1c6ead] rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Finance Dashboard
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Manage project invoicing and financial tracking
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-gray-600">Ready to Invoice</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1c6ead]" />
                  <span className="text-gray-600">
                    {projects.length} Projects
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        {financialSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Projects
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {financialSummary.totalOverview?.totalProjects || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Amount
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹
                    {(
                      financialSummary.totalOverview?.totalAmount || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Received
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹
                    {(
                      financialSummary.totalOverview?.totalReceived || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Balance
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹
                    {(
                      financialSummary.totalOverview?.totalAmount -
                        financialSummary.totalOverview?.totalReceived || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Success Message */}
        {showSuccessMessage && (
          <div className="mb-8 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-emerald-900">Success!</p>
                  <p className="text-emerald-700">{successMessage}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg p-2 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Filter className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              </div>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 text-sm text-[#1c6ead] hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Filters
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label
                  htmlFor="project"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Project
                </label>
                <select
                  id="project"
                  name="project"
                  value={filters.project}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Projects</option>
                  {projects.map((pro) => (
                    <option key={pro.id} value={pro.id}>
                      {pro.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="client"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Client
                </label>
                <select
                  id="client"
                  name="client"
                  value={filters.client}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Clients</option>
                  {client.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="paymentStatus"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Wallet className="w-4 h-4 inline mr-2" />
                  Payment Status
                </label>
                <select
                  id="paymentStatus"
                  name="paymentStatus"
                  value={filters.paymentStatus}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Payment Status</option>
                  <option value="Not Paid">Not Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Fully Paid">Fully Paid</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="invoiceStatus"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Receipt className="w-4 h-4 inline mr-2" />
                  Invoice Status
                </label>
                <select
                  id="invoiceStatus"
                  name="invoiceStatus"
                  value={filters.invoiceStatus}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Invoice Status</option>
                  <option value="Not Created">Not Created</option>
                  <option value="Created">Created</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label
                  htmlFor="amountRange"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Amount Range
                </label>
                <select
                  id="amountRange"
                  name="amountRange"
                  value={filters.amountRange}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Amounts</option>
                  <option value="low">Less than ₹50,000</option>
                  <option value="medium">₹50,000 - ₹2,00,000</option>
                  <option value="high">More than ₹2,00,000</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Selected Projects Summary */}
        {selectedProjects.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="flex items-center gap-4 ">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">
                      Projects Selected
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedProjects.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">
                      Total Amount
                    </p>
                    <p className="text-2xl font-bold text-emerald-900">
                      ₹{totalAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Total Received
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      ₹{totalReceived.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 font-medium">
                      Total Balance
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      ₹{totalBalance.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={openInvoiceModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1c6ead] text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                Create Invoice
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Completed Projects ({projects.length})
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="select-all"
                  name="select-all"
                  type="checkbox"
                  checked={
                    selectedProjects.length === projects.length &&
                    projects.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-[#1c6ead] border-gray-300 rounded focus:ring-[#1c6ead] focus:ring-2"
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium text-gray-700"
                >
                  Select All
                </label>
              </div>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <span className="sr-only">Select</span>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Project Name
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Client
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Received
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Balance
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Payment Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Invoice Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <span className="sr-only">Expand</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map((pro) => (
                    <>
                      <tr
                        key={pro.id}
                        className={`transition-all duration-200 ${
                          selectedProjects.includes(pro.id)
                            ? "bg-blue-50 border-l-4 border-[#1c6ead]"
                            : pro.tasks?.length === 0
                            ? "bg-gray-50 text-gray-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Select Checkbox */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProjects.includes(pro.id)}
                            onChange={() => handleProjectSelection(pro.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-[#1c6ead] focus:ring-2"
                          />
                        </td>

                        {/* Project Name */}
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <div>
                              <Link
                                to={`/projects/${pro.id}`}
                                className={`text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors ${
                                  pro.tasks?.length === 0 ? "text-gray-500" : ""
                                }`}
                              >
                                {pro.name}
                              </Link>
                            </div>
                          </div>
                        </td>

                        {/* Client */}
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {pro.client?.name || "No Client"}
                              </span>
                            </div>
                            {pro.client?.companyType && (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                {pro.client.companyType}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            ₹
                            {Number(pro.cost || pro.amount || 0).toLocaleString(
                              "en-IN"
                            )}
                          </div>
                        </td>

                        {/* Received */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            ₹
                            {Number(pro.receivedAmount || 0).toLocaleString(
                              "en-IN"
                            )}
                          </div>
                        </td>

                        {/* Balance */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-red-600">
                            ₹
                            {Number(pro.balanceAmount || 0).toLocaleString(
                              "en-IN"
                            )}
                          </div>
                        </td>

                        {/* Payment Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div
                            className="grid"
                            style={{ gridTemplateRows: "auto 0rem" }}
                          >
                            <span
                              className={`px-3 py-1 inline-flex items-center justify-center text-center text-xs leading-5 font-medium rounded-full border ${
                                paymentStatusColors[pro.paymentStatus] ||
                                "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              {pro.paymentStatus}
                            </span>
                            {pro.paymentHistory &&
                              pro.paymentHistory.length > 0 && (
                                <span className="text-xs text-gray-500">
                                  {pro.paymentHistory.length} payment
                                  {pro.paymentHistory.length !== 1 ? "s" : ""}
                                </span>
                              )}
                          </div>
                        </td>

                        {/* Invoice Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex items-center justify-center text-center text-xs leading-5 font-medium rounded-full border ${
                              invoiceStatusColors[
                                pro.invoiceStatus || "Not Created"
                              ]
                            }`}
                          >
                            {pro.invoiceStatus || "Not Created"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openPaymentModal(pro)}
                              disabled={pro.paymentStatus === "Fully Paid"}
                              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                pro.paymentStatus === "Fully Paid"
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                              Payment
                            </button>
                            <button
                              onClick={() => openReceiptModal(pro)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors cursor-pointer"
                              title="Upload Receipt"
                            >
                              <Upload className="w-3 h-3" />
                            </button>

                            {pro.receipts && (
                              <button
                                onClick={() => handleReceiptDownload(pro)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors cursor-pointer"
                                title="Download Receipt"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            )}

                            {/* Invoice Actions */}
                            {pro.invoiceStatus === "Created" ? (
                              <>
                                <button
                                  onClick={() => viewInvoiceModal(pro)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors cursor-pointer"
                                  title="Download Invoice"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleInvoiceDownload(pro)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                                  title="Download Invoice"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleInvoiceView(pro)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors cursor-pointer"
                                  title="Open in New Tab"
                                >
                                  <Share2 className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleInvoiceView(pro)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                                  title="Preview Invoice"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleInvoiceDownload(pro)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                                  title="Download Invoice"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Expand/Collapse Button */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleRowExpansion(pro.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                            title={
                              expandedRows.has(pro.id)
                                ? "Collapse Details"
                                : "Expand Details"
                            }
                          >
                            {expandedRows.has(pro.id) ? (
                              <ChevronUp className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row Details */}
                      {expandedRows.has(pro.id) && (
                        <tr className="bg-gray-50">
                          <td colSpan="10" className="px-4 py-6">
                            <div className="space-y-6">
                              {/* Project Timeline Table */}
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-blue-600" />
                                    Project Timeline
                                  </h4>
                                </div>
                                <table className="min-w-full divide-y divide-gray-200">
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {pro.startDate && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Start Date
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {new Date(
                                            pro.startDate
                                          ).toLocaleDateString()}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.dueDate && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Due Date
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {new Date(
                                            pro.dueDate
                                          ).toLocaleDateString()}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.createdAt && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Created Date
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {new Date(
                                            pro.createdAt
                                          ).toLocaleDateString()}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.lastPaymentDate && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Last Payment
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {new Date(
                                            pro.lastPaymentDate
                                          ).toLocaleDateString()}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {/* Team & Management Table */}
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
                                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-green-600" />
                                    Team & Management
                                  </h4>
                                </div>
                                <table className="min-w-full divide-y divide-gray-200">
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {pro.manager && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Project Manager
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.manager?.name || "Manager"}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.assignedTo && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Assigned To
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.assignedTo?.name || "Assigned"}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.team && pro.team.length > 0 && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Team Size
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.team.length} member
                                          {pro.team.length !== 1 ? "s" : ""}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.createdBy && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Created By
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.createdBy?.name || "Unknown"}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                              {/* <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="bg-orange-50 px-4 py-3 border-b border-gray-200">
                                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-orange-600" />
                                    Receipt Information
                                  </h4>showing
                                </div>
                                <table className="min-w-full divide-y divide-gray-200">
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    <tr className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm text-gray-500 font-medium">Receipt Status</td>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {pro.receipts ? (
                                          <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-green-50 text-green-700 border border-green-200">
                                              Available
                                            </span>
                                            <button
                                              onClick={() => handleReceiptDownload(pro)}
                                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer"
                                              title="Download Receipt"
                                            >
                                              <Download className="w-3 h-3" />
                                              Download
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                                            Not Available
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                    {pro.receipts && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">Receipt File</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.receipts.split('/').pop()}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div> */}

                              {/* Additional Details Table */}
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="bg-purple-50 px-4 py-3 border-b border-gray-200">
                                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-purple-600" />
                                    Additional Details
                                  </h4>
                                </div>
                                <table className="min-w-full divide-y divide-gray-200">
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {pro.client?.city && pro.client?.state && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Location
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.client.city}, {pro.client.state}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.client?.country && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Country
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.client.country}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.client?.gstin && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          GSTIN
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.client.gstin}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.client?.pan && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          PAN
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.client.pan}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.client?.cin && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          CIN
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.client.cin}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.client?.industry && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Industry
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.client.industry}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.client?.website && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Website
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          <a
                                            href={pro.client.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                          >
                                            {pro.client.website}
                                          </a>
                                        </td>
                                      </tr>
                                    )}
                                    {pro.client?.contactName && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Contact Person
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.client.contactName}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.client?.contactEmail && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Contact Email
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          <a
                                            href={`mailto:${pro.client.contactEmail}`}
                                            className="text-blue-600 hover:text-blue-800"
                                          >
                                            {pro.client.contactEmail}
                                          </a>
                                        </td>
                                      </tr>
                                    )}
                                    {pro.client?.contactPhone && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Contact Phone
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          <a
                                            href={`tel:${pro.client.contactPhone}`}
                                            className="text-blue-600 hover:text-blue-800"
                                          >
                                            {pro.client.contactPhone}
                                          </a>
                                        </td>
                                      </tr>
                                    )}
                                    {pro.client?.pin && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          PIN Code
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.client.pin}
                                        </td>
                                      </tr>
                                    )}
                                    {pro.client?.currencyFormat && (
                                      <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                          Currency Format
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {pro.client.currencyFormat}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No completed projects
              </h3>
              <p className="text-gray-500">
                No completed projects are available for invoicing at the moment.
              </p>
            </div>
          )}

          {/* Enhanced Pagination Controls */}
          {projects.length > 0 && 
          (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChanges(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-blue-600 hover:bg-blue-50 border border-gray-300 shadow-sm hover:shadow-md cursor-pointer"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChanges(currentPage + 1)}
                    disabled={currentPage === totalPage}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      currentPage === totalPage
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-blue-600 hover:bg-blue-50 border border-gray-300 shadow-sm hover:shadow-md cursor-pointer"
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {filteredProjects.length<=5?1:(currentPage - 1) * paginations.limit + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {filteredProjects.length<=5?filteredProjects.length:Math.min(
                          currentPage * paginations.limit,
                          paginations.total
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">{filteredProjects.length<=5?filteredProjects.length:paginations.total}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      {/* <button
                        onClick={() => handlePageChanges(1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-3 py-2 rounded-l-xl border text-sm font-medium transition-all duration-200 ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300 hover:border-blue-300 cursor-pointer"
                        }`}
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button> */}
                      <button
                        onClick={() => handlePageChanges(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-3 py-2 border rounded-l-xl text-sm font-medium transition-all duration-200 ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300 hover:border-blue-300 cursor-pointer"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {pages.map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChanges(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 cursor-pointer ${
                            page === currentPage
                              ? "z-10 bg-blue-50 border-[#1c6ead] text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-blue-300"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChanges(currentPage + 1)}
                        disabled={currentPage === totalPage}
                        className={`relative inline-flex items-center px-3 py-2 border rounded-r-xl text-sm font-medium transition-all duration-200 ${
                          currentPage === totalPage
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300 hover:border-blue-300 cursor-pointer"
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      {/* <button
                        onClick={() => handlePageChanges(totalPage)}
                        disabled={currentPage === totalPage}
                        className={`relative inline-flex items-center px-3 py-2 rounded-r-xl border text-sm font-medium transition-all duration-200 ${
                          currentPage === totalPage
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300 hover:border-blue-300 cursor-pointer"
                        }`}
                      >
                         <ChevronsRight className="w-4 h-4" /> 
                      {/* </button> */}
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invoice creation is now handled by InvoiceModal */}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          project={selectedProjectForPayment}
          onPaymentRecorded={handlePaymentRecorded}
        />

        {/* Invoice Modal */}
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          invoice={selectedInvoice}
          onDownload={handleInvoiceDownload}
          onView={handleInvoiceView}
          onPrint={handleInvoicePrint}
          onCreateInvoice={handleCreateInvoiceFromModal}
        />

        {/* Receipt Upload Modal */}
        {showReceiptModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Upload Receipt
                </h3>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Project name */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Project:</p>
                <p className="font-semibold text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border">
                  {receiptUploadProject?.name}
                </p>
              </div>

              {/* File upload area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Receipt File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={handleReceiptFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className={`
                    border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                    ${
                      receiptFile
                        ? "border-[#1c6ead] bg-blue-50"
                        : "border-gray-300 hover:border-[#1c6ead] hover:bg-gray-50"
                    }
                  `}
                  >
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-10 h-10 text-gray-400 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      {receiptFile ? (
                        <div>
                          <p className="text-sm font-medium text-[#1c6ead]">
                            Selected: {receiptFile.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Click to select file or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Images, PDF, DOC, XLS, CSV files supported
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleReceiptUpload}
                  disabled={!receiptFile || receiptUploading}
                  className={`
                    flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200
                    ${
                      !receiptFile || receiptUploading
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#1c6ead] text-white hover:bg-[#155a96] active:scale-95 shadow-lg hover:shadow-xl"
                    }
                  `}
                >
                  {receiptUploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    "Upload Receipt"
                  )}
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finance;
