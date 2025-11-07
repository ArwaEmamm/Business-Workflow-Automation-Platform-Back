const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// إعداد الـ Swagger Options
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BWA Workflow API',
      version: '1.0.0',
      description: 'API documentation for Workflow Management System',
    },
    servers: [
      {
        url: 'http://localhost:4000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'], // المسار اللي Swagger هيقرأ منه التعليقات الخاصة بالـ routes
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
