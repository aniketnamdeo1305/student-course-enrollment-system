// swagger.js
const swaggerJSDoc = require("swagger-jsdoc");
require('dotenv').config();

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Student Course Enrollment API",
            version: "1.0.0",
            description: "API documentation for course enrollment platform",
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT}`,
            },
        ],
    },
    apis: ["./index.js"],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
