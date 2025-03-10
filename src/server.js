import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const app = express();

// Load Swagger YAML file
const swaggerDocument = YAML.load("./swagger.yml");

// Middleware to serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Middleware to access the JSON body of requests
app.use(express.json());
// Middleware to allow access from other domains
app.use(cors());
// Middleware for logging errors
app.use(morgan('dev'));

const PORT = parseInt(process.env.PORT || 3000);
const HOST = process.env.IP || '127.0.0.1';

// ===========================================================================
// ============================= ROUTES BELOW ================================
// ===========================================================================


// ===========================================================================
// ============================= ROUTES ABOVE ================================
// ===========================================================================

const server = app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});

process.on('SIGINT', () => {
    server.close(() => {
      console.log('Shutting down server gracefully.');
      process.exit();
    });
});
