import React, { useState } from 'react';
import { tagDocumentRequirements } from '../utils/tagDocumentFields';

const TagDocumentUpload = ({ tag, onUpload, onRemindClient, existingDocuments = {}, clientInfo, isLoading = false }) => {
    const requirements = tagDocumentRequirements[tag] || [];
    const [remindingDocuments, setRemindingDocuments] = useState(new Set());

    const handleFileChange = (documentType, e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('Selected file for upload:', {
                tag,
                documentType,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            });
            onUpload(tag, documentType, file);
        }
    };

    const handleRemindClient = async (doc) => {
        if (!clientInfo || !clientInfo.contactPhone) {
            alert('Client phone number not available for reminders');
            return;
        }

        if (!onRemindClient) {
            alert('Reminder functionality not available');
            return;
        }

        const confirmMessage = `Send reminder to ${clientInfo.name} for "${doc.name}"?`;
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            setRemindingDocuments(prev => new Set([...prev, doc.type]));
            
            await onRemindClient({
                documentName: doc.name,
                documentType: doc.type,
                tag: tag
            });

            alert(`Reminder sent to ${clientInfo.name} successfully!`);
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert('Failed to send reminder. Please try again.');
        } finally {
            setRemindingDocuments(prev => {
                const newSet = new Set(prev);
                newSet.delete(doc.type);
                return newSet;
            });
        }
    };

    return (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">{tag} Documents</h3>
            <div className="space-y-4">
                {requirements.map(doc => {
                    const documentKey = `${tag}-${doc.type}`;
                    const existingDoc = existingDocuments[documentKey];
                    const isReminding = remindingDocuments.has(doc.type);
                    const canRemind = clientInfo && clientInfo.contactPhone && onRemindClient;

                    return (
                        <div key={doc.type} className="flex items-center justify-between">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    {doc.name}
                                    {doc.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {existingDoc ? (
                                    <div className="text-sm text-gray-500">
                                        Current: {existingDoc.fileName}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500">No document uploaded</div>
                                )}
                                {clientInfo && (
                                    <div className="text-xs text-gray-400 mt-1">
                                        Client: {clientInfo.name} {clientInfo.contactPhone ? `(${clientInfo.contactPhone})` : '(No phone)'}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                {/* Remind Client Button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemindClient(doc)}
                                    disabled={!canRemind || isReminding || isLoading}
                                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                        canRemind && !isReminding && !isLoading
                                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                    title={
                                        !clientInfo?.contactPhone 
                                            ? 'Client phone number not available'
                                            : isReminding 
                                                ? 'Sending reminder...'
                                                : 'Send reminder to client'
                                    }
                                >
                                    {isReminding ? (
                                        <div className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending...
                                        </div>
                                    ) : (
                                        'Remind Client'
                                    )}
                                </button>

                                {/* Upload Button */}
                                <label className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700">
                                    {existingDoc ? 'Replace' : 'Upload'}
                                    <input
                                        type="file"
                                        onChange={(e) => handleFileChange(doc.type, e)}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.jpg,.jpeg,.png"
                                    />
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TagDocumentUpload; 