import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import { inputOrder } from "./databaseFunctions.js";

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

// Add order from ubl doc to database
app.post('/api/orders/input', (req, res) => {
    const {
        SalesOrderId, UUID, IssueDate, PartyName, PayableAmount, PayableCurrencyCode,
        ItemDescription, BuyersItemIdentification, SellersItemIdentification, ItemAmount, ItemUnitCode
    } = req.body;

    res.set('content-type', 'application/json');

    inputOrder(
        SalesOrderId, UUID, IssueDate, PartyName, PayableAmount, PayableCurrencyCode,
        ItemDescription, BuyersItemIdentification, SellersItemIdentification, ItemAmount, ItemUnitCode,
        (err, result) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json(result);
        }
    );
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
