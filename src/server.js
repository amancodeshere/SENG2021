import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import {
    inputOrder,
    getOrderBySalesOrderID,
    getOrderIdsByPartyName,
    deleteOrderById,
    getItemsBySalesOrderID
} from "./orderToDB.js";

import {
    inputInvoice,
    getInvoiceByID,
    getInvoicesByCompanyName,
    deleteInvoiceById
} from "./invoiceToDB.js";

import {
    validateInvoice
} from "./validate.js";

const app = express();
// Middleware to access the JSON body of requests
app.use(bodyParser.json());
// Middleware to allow access from other domains
app.use(cors());
// Middleware for logging errors
app.use(morgan('dev'));

const PORT = parseInt(process.env.PORT || 3000);
const HOST = process.env.IP || '127.0.0.1';

// ===========================================================================
// ============================= ROUTES BELOW ================================
// ===========================================================================

// Delete order based on orderId
app.delete('/api/orders/delete/:orderId', (req, res) => {
    const { orderId } = req.params;

    deleteOrderById(orderId, (err, result) => {
        res.set('Content-Type', 'application/json');
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(200).json(result);
    });
});

// Add order from ubl doc to database
app.post('/api/orders/input', (req, res) => {
    const {
        SalesOrderId, UUID, IssueDate, PartyName, PayableAmount, PayableCurrencyCode, Items
    } = req.body;

    // items === array
    if (!Array.isArray(Items) || Items.length === 0) {
        return res.status(400).json({ error: 'Invalid or missing Items array.' });
    }

    res.set('content-type', 'application/json');

    inputOrder(
        SalesOrderId, UUID, IssueDate, PartyName, PayableAmount, PayableCurrencyCode, Items,
        (err, result) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json(result);
        }
    );
});

// Get orders by SalesOrderId
app.get('/api/orders/:SalesOrderID', (req, res) => {
    const { SalesOrderID } = req.params;

    getOrderBySalesOrderID(SalesOrderID, (err, result) => {
        res.set('Content-Type', 'application/json');
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(200).json(result);
    });
});

// Get the list of orders placed by a company given the party name
app.get('/api/orders/party/:partyName', (req, res) => {
    const { partyName } = req.params;

    getOrderIdsByPartyName(partyName, (err, result) => {
        res.set('Content-Type', 'application/json');
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(200).json({ SalesOrderIDs: result });
    });
});

// Get items by SalesOrderID
app.get('/api/orders/:SalesOrderID/items', (req, res) => {
    const { SalesOrderID } = req.params;

    getItemsBySalesOrderID(SalesOrderID, (err, result) => {
        res.set('Content-Type', 'application/json');
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(200).json({ items: result });
    });
});

// input an invoice into the database
app.post('/api/invoices/input/:SalesOrderID', (req, res) => {
    const { SalesOrderID } = req.params;

    res.set('Content-Type', 'application/json');

    inputInvoice(SalesOrderID, (err, result) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(200).json(result);
    });
});

// get invoice by InvoiceID
app.get("/api/invoices/:invoiceID", (req, res) => {
    const { invoiceID } = req.params;

    getInvoiceByID(invoiceID, (err, result) => {
        res.set("Content-Type", "application/json");
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(200).json(result);
    });
});

// get list of invoices given party name
app.get('/api/invoices/company/:PartyNameBuyer', (req, res) => {
    const { PartyNameBuyer } = req.params;

    getInvoicesByCompanyName(PartyNameBuyer, (err, result) => {
        res.set("Content-Type", "application/json");
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(200).json({ invoices: result });
    });
});

// delete an invoice given invoiceID
app.delete('/api/invoices/delete/:invoiceId', (req, res) => {
    const { invoiceId } = req.params;

    deleteInvoiceById(invoiceId, (err, result) => {
        res.set("Content-Type", "application/json");
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(200).json(result);
    });
});

// validate a given XML invoice
app.get('/api/v1/invoice/validate', (req, res) => {
    const { invoice } = req.body;

    validateInvoice(invoice, (err, result) => {
        res.set("Content-Type", "application/json");
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(200).json(result);
    });

});

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
