const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Swagger definition
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CA-ERP API Documentation',
            version: '1.0.0',
            description: 'API documentation for CA-ERP system',
            contact: {
                name: 'CA-ERP Team',
            },
            servers: [
                {
                    url: `http://localhost:${process.env.PORT || 5000}`,
                    description: 'Development server',
                },
            ],
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Path to the API docs
    apis: [
        './src/routes/*.js',
        './src/models/*.js',
    ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Function to setup swagger in the app
const swaggerDocs = (app) => {
    // Swagger page
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Docs in JSON format
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log(`Swagger docs available at /api-docs`);
};

module.exports = swaggerDocs; 