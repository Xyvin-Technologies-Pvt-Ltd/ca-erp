export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    FINANCE: 'finance',
};

export const TASK_STATUS = {
    TODO: 'To-Do',
    IN_PROGRESS: 'In Progress',
    UNDER_REVIEW: 'Under Review',
    COMPLETED: 'Completed',
    INVOICEABLE: 'Invoiceable',
    INVOICED: 'Invoiced',
};

export const NOTIFICATION_TYPES = {
    TASK_ASSIGNED: 'task_assigned',
    TASK_UPDATED: 'task_updated',
    TASK_COMPLETED: 'task_completed',
    DOCUMENT_REQUIRED: 'document_required',
    COMPLIANCE_DUE: 'compliance_due',
    INVOICE_REQUIRED: 'invoice_required',
};

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    CLIENTS: '/clients',
    LEADS: '/leads',
    PROJECTS: '/projects',
    TASKS: '/tasks',
    DOCUMENTS: '/documents',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    FINANCE: '/finance',

    PROFILES: '/profile',


}; 