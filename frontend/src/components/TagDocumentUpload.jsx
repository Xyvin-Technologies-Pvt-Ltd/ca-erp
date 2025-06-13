import React from 'react';
import { tagDocumentRequirements } from '../utils/tagDocumentFields';

const TagDocumentUpload = ({ tag, onUpload, existingDocuments = {} }) => {
    const requirements = tagDocumentRequirements[tag] || [];

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

    return (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">{tag} Documents</h3>
            <div className="space-y-4">
                {requirements.map(doc => {
                    const documentKey = `${tag}-${doc.type}`;
                    const existingDoc = existingDocuments[documentKey];

                    return (
                        <div key={doc.type} className="flex items-center justify-between">
                            <div>
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
                            </div>
                            <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                {existingDoc ? 'Replace' : 'Upload'}
                                <input
                                    type="file"
                                    onChange={(e) => handleFileChange(doc.type, e)}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.jpg,.jpeg,.png"
                                />
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TagDocumentUpload; 