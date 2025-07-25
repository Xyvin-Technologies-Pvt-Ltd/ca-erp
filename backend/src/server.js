const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { logger } = require('./utils/logger');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const swaggerDocs = require('./swagger/swagger');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const { config } = require('dotenv');
const WebSocket = require('ws');
const websocketService = require('./utils/websocket');
const cronService = require('./services/cronService');
const seedSuperAdmin = require('./utils/seedSuperAdmin').seedSuperAdmin;
// Load env vars
config();

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const clientRoutes = require('./routes/client.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const documentRoutes = require('./routes/document.routes');
const financeRoutes = require('./routes/finance.routes');
const settingsRoutes = require('./routes/settings.routes');
const notificationRoutes = require('./routes/notification.routes');
const activityRoutes = require('./routes/activity.routes');
const departments = require('./routes/department.routes')
const positionRoutes = require('./routes/position.routes')
const eventsRoutes = require('./routes/event.routes')
const leavesRoutes = require('./routes/leave.routes')
const attendanceRoutes = require('./routes/attendance.routes')
const cronJobRoutes = require('./routes/cronJob.routes')
const sectionRoutes = require('./routes/section.routes')

// Initialize express app
const app = express();

// Connect to database and seed superadmin
const initializeServer = async () => {
    try {
        // Connect to database
        await connectDB();
        logger.info('Database connected successfully');

        // Seed superadmin after database connection
        console.log('🔍 Checking for superadmin...');
        await seedSuperAdmin();
        console.log('✅ Superadmin check completed');

    } catch (error) {
        logger.error('Failed to initialize server:', error);
        console.error('❌ Server initialization failed:', error.message);
        process.exit(1);
    }
};

// Initialize cron jobs after DB connection
cronService.init();

// Set up rate limiting
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // limit each IP to 100 requests per windowMs
//     standardHeaders: true,
//     legacyHeaders: false,
//     message: 'Too many requests from this IP, please try again after 15 minutes'
// });

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://api-ca-erp.xyvin.com', 'https://ca-erp.xyvin.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
// app.use(limiter);

// Prevent XSS attacks
app.use(xss());

// Prevent HTTP param pollution
app.use(hpp());

// Set static folder
app.use(express.static(path.join(__dirname, '../public')));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/departments',departments)
app.use('/api/positions',positionRoutes)
app.use('/api/events',eventsRoutes)
app.use('/api/leaves',leavesRoutes)
app.use('/api/attendance',attendanceRoutes)
app.use('/api/cronjobs', cronJobRoutes)
app.use('/api/sections', sectionRoutes)



// Swagger documentation
swaggerDocs(app);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const { checkSuperAdmin } = require('./utils/seedSuperAdmin');
        const superadminExists = await checkSuperAdmin();
        
        res.status(200).json({ 
            status: 'ok', 
            message: 'Server is running',
            superadmin: {
                exists: superadminExists,
                email: 'xyvinSuperadmin@gmail.com'
            }
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Server is running but health check failed',
            error: error.message
        });
    }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`Server running on port ${PORT}`);
    
    // Initialize server (database connection and seeding)
    try {
        await initializeServer();
        logger.info('Server initialized successfully');
        console.log('✅ Server initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize server:', error);
        console.error('❌ Server initialization failed:', error.message);
        process.exit(1);
    }
    
    // Initialize cron service
    try {
        await cronService.init();
        logger.info('Cron service initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize cron service:', error);
    }
});
// Initialize WebSocket
websocketService.init(server);


// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

module.exports = { server };