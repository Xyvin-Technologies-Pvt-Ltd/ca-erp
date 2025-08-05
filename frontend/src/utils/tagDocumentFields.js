export const tagDocumentRequirements = {
    GST: [
        { name: 'GST Registration Certificate', type: 'gst_certificate', required: true },
        { name: 'GST Returns', type: 'gst_returns', required: true },
        { name: 'GST Challan', type: 'gst_challan', required: false }
    ],
    'Income Tax': [
        { name: 'PAN Card', type: 'pan_card', required: true },
        { name: 'Form 16', type: 'form_16', required: true },
        { name: 'ITR Acknowledgment', type: 'itr_acknowledgment', required: true }
    ],
    TDS: [
        { name: 'TDS Certificate', type: 'tds_certificate', required: true },
        { name: 'Form 16A', type: 'form_16a', required: true },
        { name: 'TDS Returns', type: 'tds_returns', required: false }
    ],
    ROC: [
        { name: 'Company Registration', type: 'company_registration', required: true },
        { name: 'Annual Returns', type: 'annual_returns', required: true },
        { name: 'Director Details', type: 'director_details', required: true }
    ],
    Audit: [
        { name: 'Balance Sheet', type: 'balance_sheet', required: true },
        { name: 'Profit & Loss', type: 'profit_loss', required: true },
        { name: 'Audit Report', type: 'audit_report', required: true }
    ],
    Compliance: [
        { name: 'Compliance Certificate', type: 'compliance_certificate', required: true },
        { name: 'Statutory Reports', type: 'statutory_reports', required: true }
    ],
    'Financial Statements': [
        { name: 'Balance Sheet', type: 'balance_sheet', required: true },
        { name: 'Profit & Loss', type: 'profit_loss', required: true },
        { name: 'Cash Flow', type: 'cash_flow', required: true },
        { name: 'Notes to Accounts', type: 'notes', required: false }
    ],
    Taxation: [
        { name: 'Tax Computation Sheet', type: 'tax_computation', required: true },
        { name: 'Tax Payment Challan', type: 'tax_payment_challan', required: false }
    ],
    'Transfer Pricing': [
        { name: 'Transfer Pricing Report', type: 'transfer_pricing_report', required: true },
        { name: 'Supporting Documents', type: 'supporting_documents', required: false }
    ],
    'International Tax': [
        { name: 'Foreign Income Statement', type: 'foreign_income', required: true },
        { name: 'DTAA Certificate', type: 'dtaa_certificate', required: false }
    ],
    'Wealth Management': [
        { name: 'Investment Portfolio', type: 'investment_portfolio', required: true },
        { name: 'Net Worth Statement', type: 'net_worth', required: false }
    ],
    Banking: [
        { name: 'Bank Statement', type: 'bank_statement', required: true },
        { name: 'Loan Documents', type: 'loan_documents', required: false }
    ],
    FEMA: [
        { name: 'FEMA Declaration', type: 'fema_declaration', required: true },
        { name: 'Inbound/Outbound Remittance Proof', type: 'remittance_proof', required: false }
    ],
    Reconciliation: [
        { name: 'Ledger Reconciliation', type: 'ledger_reconciliation', required: true },
        { name: 'Bank Reconciliation Statement', type: 'bank_reconciliation', required: true }
    ],
    '44AB': [
        { name: 'Tax Audit Report (Form 3CD)', type: 'form_3cd', required: true },
        { name: 'Form 3CA/3CB', type: 'form_3ca_3cb', required: true }
    ]
};
