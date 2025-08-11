const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { ErrorResponse } = require('./errorHandler');
require('dotenv').config();

// Ensure upload directory exists
const createUploadDir = (folderPath) => {
    const fullPath = path.join(process.env.FILE_UPLOAD_PATH || './public/uploads', folderPath);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
    return fullPath;
};

// Configure storage for different upload types
const storage = {
    documents: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = createUploadDir('/documents');
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            // Create a custom filename with timestamp to prevent duplicates
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
    }),
    avatars: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = createUploadDir('/avatars');
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            // For avatars, use the user's ID as the filename
            const ext = path.extname(file.originalname);
            const filename = req.user ? `avatar-${req.user._id}${ext}` : `avatar-${Date.now()}${ext}`;
            cb(null, filename);
        },
    }),
    logos: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = createUploadDir('/logos');
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `company-logo${ext}`);
        },
    }),

    // Add storage for task files
    taskFiles: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = createUploadDir('/taskFiles');
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
    }),

    // Update tag documents storage
    tagDocuments: multer.diskStorage({
        destination: function(req, file, cb) {
            try {
                const taskId = req.params.id;
                const uploadPath = createUploadDir(`/tagDocuments/${taskId}`);
                cb(null, uploadPath);
            } catch (error) {
                console.error('Error in destination handler:', error);
                cb(error);
            }
        },
        filename: function(req, file, cb) {
            try {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
                cb(null, filename);
            } catch (error) {
                console.error('Error in filename handler:', error);
                cb(error);
            }
        }
    }),
    receipts: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = createUploadDir('/receipts');
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            // const ext = path.extname(file.originalname);
            // cb(null, `receipt-${uniqueSuffix}${ext}`);
          cb(null, file.originalname);
        },
    }),
};

// File filter to check file types
const fileFilter = (req, file, cb) => {
    try {
        console.log('Checking file:', {
            mimetype: file.mimetype,
            originalname: file.originalname
        });

        // Define allowed mime types
        const allowedMimeTypes = {
            documents: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain',
                'text/csv',
                'application/zip',
                'application/x-zip-compressed',
                'image/jpeg',
                'image/png',
            ],
            avatars: ['image/jpeg', 'image/png', 'image/gif'],
            receipts: ['image/jpeg', 'image/png', 'application/pdf'],
            logos: ['image/jpeg', 'image/png', 'image/svg+xml'],
            taskFiles: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'image/jpeg', 'image/png', 'application/zip', 'application/x-zip-compressed'],
            tagDocuments: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain',
                'text/csv',
                'application/zip',
                'application/x-zip-compressed',
                'image/jpeg',
                'image/png'
            ]
        };

        // Determine upload type based on route
        let uploadType = 'documents';
        if (req.originalUrl.includes('avatars')) {
            uploadType = 'avatars';
        } else if (req.originalUrl.includes('logos')) {
            uploadType = 'logos';
        } else if (req.originalUrl.includes('tag-documents')) {
            uploadType = 'tagDocuments';
        }else if (req.originalUrl.includes('upload-receipt')) {
    uploadType = 'receipts';
}


        // Check if the file type is allowed
        if (allowedMimeTypes[uploadType].includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.error('Invalid file type:', file.mimetype);
            cb(
                new ErrorResponse(
                    `File type not allowed. Allowed types: ${allowedMimeTypes[uploadType].join(
                        ', '
                    )}`,
                    400
                ),
                false
            );
        }
    } catch (error) {
        console.error('Error in file filter:', error);
        cb(error);
    }
};

// Create multer instance with limits
const upload = (type = 'documents') => {
    return multer({
        storage: storage[type],
        limits: {
            fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5000000, // Default to 5MB
        },
        fileFilter,
    });
};

// Export multer upload middlewares for different file types
module.exports = {
    uploadDocument: upload('documents'),
    uploadAvatar: upload('avatars'),
    uploadLogo: upload('logos'),
    uploadTaskFile: upload('taskFiles'),
    uploadTagDocument: upload('tagDocuments'),
    uploadReceipt:upload('receipts')
}; 