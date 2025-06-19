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

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Set up rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
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
app.use(limiter);

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



// Swagger documentation
swaggerDocs(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`Server running on port ${PORT}`);
});
// Initialize WebSocket
websocketService.init(server);

// const wss = new WebSocket.Server({ server });
// Store WebSocket server instance
// const wsInstance = {
//   getWss: () => wss
// };
// wss.on('connection', (ws, req) => {
//   console.log('New WebSocket connection');

//   // Handle incoming messages
//   ws.on('message', (message) => {
//     try {
//       const parsedMessage = JSON.parse(message);
//       // Broadcast the message to all connected clients
//       wss.clients.forEach((client) => {
//         if (client !== ws && client.readyState === WebSocket.OPEN) {
//           client.send(JSON.stringify(parsedMessage));
//         }
//       });
//     } catch (error) {
//       console.error('Error processing message:', error);
//     }
//   });
// // Send initial connection success message
// ws.send(JSON.stringify({ type: 'connection', message: 'Connected to WebSocket server' }))
//   // Handle client disconnection
//   ws.on('close', () => {
//     console.log('Client disconnected');
//   });
// });
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

module.exports = { server };