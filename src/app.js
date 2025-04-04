import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import swaggerUi from "swagger-ui-express";
import {
    adminRegister,
    adminLogin
} from './admin.js';
import { invoiceToXml, viewInvoice, validateInvoice, listInvoices } from './invoice.js';
import { getUserBySessionId } from "./UsersToDB.js";
import { handlePostInvoice } from './invoice.js';
import { healthCheck } from './health.js';

export const app = express();

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(bodyParser.text({ type: 'application/xml' })); // Handle XML

// Middleware to access the JSON body of requests
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware to allow access from other domains
app.use(cors());
// Middleware for logging errors
app.use(morgan('dev'));

// ===========================================================================
// ============================= ROUTES BELOW ================================
// ===========================================================================

// Health check route
app.get('/api/health', (req, res) => {
    healthCheck(req, res);
});

// register a new user
app.post('/api/v1/admin/register', (req, res) => {
    const { companyName, email, password } = req.body;
  
    adminRegister(email, password, companyName, (err, result) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        res.status(200).json(result);
    });
});

// login an existing user
app.post('/api/v1/admin/login', (req, res) => {
    const { email, password } = req.body;
  
    adminLogin(email, password, (err, result) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        res.status(200).json(result);
    });
});

// Create new invoice
app.post('/api/v1/invoice/create', (req, res) => {
    handlePostInvoice(req, res);
});

// view an invoice
app.get('/api/v1/invoice/:invoiceid', (req, res) => {
    const sessionId = parseInt(req.headers.sessionid);
    const invoiceId = req.params.invoiceid;

    getUserBySessionId(sessionId, (sessionErr, user) => {
        if (sessionErr) {
            return res.status(401).json({ error: sessionErr.message });
        }

        viewInvoice(invoiceId, (err, result) => {
            if (err) {
                return res.status(404).json({ error: err.message });
            }
            res.status(200).json(result);
        });
    });
});

// create UBL XML invoice
app.get('/api/v1/invoice/:invoiceid/xml', (req, res) => {
    const sessionId = parseInt(req.headers.sessionid);
    const invoiceId = req.params.invoiceid;

    getUserBySessionId(sessionId, (sessionErr, user) => {
        if (sessionErr) {
            return res.status(401).json({ error: sessionErr.message });
        }

        invoiceToXml(invoiceId, user.company, (invoiceErr, invoiceResult) => {
            if (invoiceErr) {
                return res.status(404).json({ error: invoiceErr.message });
            }
            res.status(200)
                .set('Content-Type', 'application/xml')
                .send(invoiceResult);
        });
    });
});

// validate a given XML invoice
app.post('/api/v1/invoice/validate', (req, res) => {
    const { invoice } = req.body;

    validateInvoice(invoice, (result) => {
        res.set("Content-Type", "application/json");
        res.status(200).json(result);
    });

});

// View an list of invoices by partyNameBuyer
app.get('/api/v1/invoices/list', (req, res) => {
    const sessionId = parseInt(req.headers.sessionid);
    const partyNameBuyer = req.query.partyNameBuyer

    getUserBySessionId(sessionId, (sessionErr, user) => {
        if (sessionErr) {
            return res.status(401).json({ error: sessionErr.message });
        }

        listInvoices(partyNameBuyer, (err, result) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.status(200).json(result);
        });
    });
});

app.get('/', (req, res) => {
    res.send('🚀 Server is running!');
});

// ===========================================================================
// ============================= ROUTES ABOVE ================================
// ===========================================================================
