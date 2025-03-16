import { db } from '../connect.js';
import { CustomInputError } from '../errors.js';
import { UBLBuilder } from 'ubl-builder';
import { inputOrder } from './orderToDB.js';
import { inputInvoice } from './invoiceToDB.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Validates the required fields in the document
 * @param {Object} document - The document to validate
 * @returns {boolean} - Whether the document is valid
 */
function validateDocument(document) {
    const requiredFields = ['SalesOrderID', 'IssueDate', 'PartyName', 'PayableAmount', 'CurrencyCode'];
    return requiredFields.every(field => document[field] !== undefined);
}

/**
 * Parses XML document using UBL standard and extracts required fields
 * @param {string} xmlString - XML document string
 * @returns {Object} - Parsed document with required fields
 */
function parseXMLDocument(xmlString) {
    try {
        const ubl = new UBLBuilder();
        const invoice = ubl.parseInvoiceXML(xmlString);

        return {
            SalesOrderID: invoice.getOrderReference(),
            IssueDate: invoice.getIssueDate(),
            PartyName: invoice.getAccountingCustomerParty().getName(),
            PayableAmount: parseFloat(invoice.getLegalMonetaryTotal().getPayableAmount()),
            CurrencyCode: invoice.getDocumentCurrencyCode(),
            Items: invoice.getInvoiceLines().map(line => ({
                ItemDescription: line.getItem().getDescription(),
                BuyersItemIdentification: line.getItem().getBuyersItemIdentification(),
                SellersItemIdentification: line.getItem().getSellersItemIdentification(),
                ItemAmount: parseFloat(line.getInvoicedQuantity()),
                ItemUnitCode: line.getInvoicedQuantity().getUnitCode()
            }))
        };
    } catch (error) {
        throw new CustomInputError('Invalid XML document');
    }
}

/**
 * Creates an invoice using the order-first approach
 * @param {Object} document - The validated document data
 * @returns {Promise<number>} - The ID of the created invoice
 */
async function createInvoiceFromDocument(document) {
    return new Promise((resolve, reject) => {
        // First create an order
        const orderData = {
            SalesOrderID: document.SalesOrderID,
            UUID: uuidv4(),
            IssueDate: document.IssueDate,
            PartyName: document.PartyName,
            PayableAmount: document.PayableAmount,
            PayableCurrencyCode: document.CurrencyCode,
            Items: document.Items || [{
                ItemDescription: "Default Item",
                BuyersItemIdentification: "DEFAULT-BUYER",
                SellersItemIdentification: "DEFAULT-SELLER",
                ItemAmount: document.PayableAmount,
                ItemUnitCode: "EA"
            }]
        };

        // Create order first
        inputOrder(
            orderData.SalesOrderID,
            orderData.UUID,
            orderData.IssueDate,
            orderData.PartyName,
            orderData.PayableAmount,
            orderData.PayableCurrencyCode,
            orderData.Items,
            (orderErr) => {
                if (orderErr) {
                    console.error('Error creating order:', orderErr);
                    reject(new Error('Failed to create invoice: ' + orderErr.message));
                    return;
                }

                // Then create invoice from the order
                inputInvoice(orderData.SalesOrderID, (invoiceErr, result) => {
                    if (invoiceErr) {
                        console.error('Error creating invoice:', invoiceErr);
                        reject(new Error('Failed to create invoice: ' + invoiceErr.message));
                        return;
                    }
                    resolve(result.InvoiceID);
                });
            }
        );
    });
}

/**
 * Handles the POST /api/invoice request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handlePostInvoice(req, res) {
    try {
        let document;
        if (req.headers['content-type'] === 'application/xml') {
            if (!req.body || typeof req.body !== 'string') {
                return res.status(400).json({ error: 'Invalid document format' });
            }
            document = parseXMLDocument(req.body);
        } else if (req.headers['content-type'] === 'application/json') {
            if (!req.body || typeof req.body !== 'object') {
                return res.status(400).json({ error: 'Invalid document format' });
            }
            document = req.body;
        } else {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        if (!document || Object.keys(document).length === 0) {
            return res.status(400).json({ error: 'Document is required' });
        }

        if (!validateDocument(document)) {
            return res.status(400).json({ error: 'Missing required fields in document' });
        }

        const invoiceId = await createInvoiceFromDocument(document);
        res.status(200).json({ invoiceId });

    } catch (error) {
        if (error instanceof CustomInputError) {
            res.status(400).json({ error: error.message });
        } else {
            console.error('Unexpected error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
