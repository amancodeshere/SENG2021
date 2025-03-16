import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import {
    adminRegister,
    adminLogin
} from './admin.js';
import { invoiceToXml } from './invoice.js';
import {
    inputOrder,
    getOrderBySalesOrderID,
    getOrderIdsByPartyName,
    deleteOrderById,
    getItemsBySalesOrderID
} from './orderToDB.js';
import {
    inputInvoice,
    getInvoiceByID,
    getInvoicesByCompanyName,
    deleteInvoiceById
} from './invoiceToDB.js';
import { userInput, getUserBySessionId } from "./UsersToDB.js";
import { validateInvoice } from './validate.js';

import { healthCheck } from './health.js';

export const app = express();
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
app.get('/api/health', healthCheck);

// register a new user
app.post('/api/v1/admin/register', bodyParser.json(), (req, res) => {
    const { companyName, email, password } = req.body;
  
    adminRegister(email, password, companyName, (err, result) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        res.status(200).json(result);
    });
});

// login an existing user
app.post('/api/v1/admin/login', bodyParser.json(), (req, res) => {
    const { email, password } = req.body;
  
    adminLogin(email, password, (err, result) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        res.status(200).json(result);
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
app.post('/api/v1/invoice/validate', bodyParser.json(), (req, res) => {
    const { invoice } = req.body;

    validateInvoice(invoice, (result) => {
        res.set("Content-Type", "application/json");
        res.status(200).json(result);
    });

});

// --------------------------------------------------------------------------
// ---------------- Routes to manually test database functions --------------
// ---------------- commented out to check coverage correctly ----------------

// // Delete order based on orderId
// app.delete('/api/orders/delete/:orderId', (req, res) => {
//     const { orderId } = req.params;

//     deleteOrderById(orderId, (err, result) => {
//         res.set('Content-Type', 'application/json');
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(200).json(result);
//     });
// });

// // Add order from ubl doc to database
// app.post('/api/orders/input', (req, res) => {
//     const {
//         SalesOrderId, UUID, IssueDate, PartyName, PayableAmount, PayableCurrencyCode, Items
//     } = req.body;

//     // items === array
//     if (!Array.isArray(Items) || Items.length === 0) {
//         return res.status(400).json({ error: 'Invalid or missing Items array.' });
//     }

//     res.set('content-type', 'application/json');

//     inputOrder(
//         SalesOrderId, UUID, IssueDate, PartyName, PayableAmount, PayableCurrencyCode, Items,
//         (err, result) => {
//             if (err) {
//                 return res.status(400).json({ error: err.message });
//             }
//             res.json(result);
//         }
//     );
// });

// // Get orders by SalesOrderId
// app.get('/api/orders/:SalesOrderID', (req, res) => {
//     const { SalesOrderID } = req.params;

//     getOrderBySalesOrderID(SalesOrderID, (err, result) => {
//         res.set('Content-Type', 'application/json');
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(200).json(result);
//     });
// });

// // Get the list of orders placed by a company given the party name
// app.get('/api/orders/party/:partyName', (req, res) => {
//     const { partyName } = req.params;

//     getOrderIdsByPartyName(partyName, (err, result) => {
//         res.set('Content-Type', 'application/json');
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(200).json({ SalesOrderIDs: result });
//     });
// });

// // Get items by SalesOrderID
// app.get('/api/orders/:SalesOrderID/items', (req, res) => {
//     const { SalesOrderID } = req.params;

//     getItemsBySalesOrderID(SalesOrderID, (err, result) => {
//         res.set('Content-Type', 'application/json');
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(200).json({ items: result });
//     });
// });

// // input an invoice into the database
// app.post('/api/invoices/input/:SalesOrderID', (req, res) => {
//     const { SalesOrderID } = req.params;

//     res.set('Content-Type', 'application/json');

//     inputInvoice(SalesOrderID, (err, result) => {
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(200).json(result);
//     });
// });

// // get list of invoices given party name
// app.get('/api/invoices/company/:PartyNameBuyer', (req, res) => {
//     const { PartyNameBuyer } = req.params;

//     getInvoicesByCompanyName(PartyNameBuyer, (err, result) => {
//         res.set("Content-Type", "application/json");
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(200).json({ invoices: result });
//     });
// });

// // get invoice by InvoiceID
// app.get("/api/invoices/:invoiceID", (req, res) => {
//     const { invoiceID } = req.params;

//     getInvoiceByID(invoiceID, (err, result) => {
//         res.set("Content-Type", "application/json");
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(200).json(result);
//     });
// });

// // delete an invoice given invoiceID
// app.delete('/api/invoices/delete/:invoiceId', (req, res) => {
//     const { invoiceId } = req.params;

//     deleteInvoiceById(invoiceId, (err, result) => {
//         res.set("Content-Type", "application/json");
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(200).json(result);
//     });
// });

// // user input to db
// app.post('/api/users/register/db', (req, res) => {
//     const { email, password, company } = req.body;

//     res.set('Content-Type', 'application/json');

//     userInput(email, password, company, (err, result) => {
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(201).json(result);
//     });
// });

// // update session after login
// app.post('/api/users/session/update', (req, res) => {
//     const { email } = req.body;

//     if (!email) {
//         return res.status(400).json({ error: "Email is required." });
//     }

//     updateUserSession(email, (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         res.status(200).json(result);
//     });
// });

// // get user details from sessionId
// app.get("/api/users/session/:sessionId", (req, res) => {
//     const sessionId = parseInt(req.params.sessionId, 10);

//     getUserBySessionId(sessionId, (err, result) => {
//         res.set("Content-Type", "application/json");
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(200).json(result);
//     });
// });

// app.get("/api/users/sessions/:email", (req, res) => {
//     const email = decodeURIComponent(req.params.email).toLowerCase();

//     getSessionsByEmail(email, (err, result) => {
//         res.set("Content-Type", "application/json");
//         if (err) {
//             return res.status(400).json({ error: err.message });
//         }
//         res.status(200).json({ sessions: result });
//     });
// });

// ===========================================================================
// ============================= ROUTES ABOVE ================================
// ===========================================================================
