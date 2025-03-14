import { db } from '../connect.js';
import { CustomInputError } from '../errors.js';
import { UBLBuilder } from 'ubl-builder';

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
            CurrencyCode: invoice.getDocumentCurrencyCode()
        };
    } catch (error) {
        throw new CustomInputError('Invalid XML document');
    }
}

/**
 * Creates a new invoice in the database
 * @param {Object} document - The validated document data
 * @returns {Promise<number>} - The ID of the created invoice
 */
async function createInvoiceFromDocument(document) {
    return new Promise((resolve, reject) => {
        db.exec('BEGIN TRANSACTION;', (beginErr) => {
            if (beginErr) {
                console.error('Error starting transaction:', beginErr);
                reject(new Error('Database error while creating invoice'));
                return;
            }

            const sql = `
                INSERT INTO invoices (
                    sales_order_id,
                    issue_date,
                    party_name_buyer,
                    payable_amount,
                    currency_code
                ) VALUES (?, ?, ?, ?, ?);
            `;

            const params = [
                document.SalesOrderID,
                document.IssueDate,
                document.PartyName,
                document.PayableAmount,
                document.CurrencyCode
            ];

            db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error inserting invoice:', err);
                    db.exec('ROLLBACK;', () => {
                        reject(new Error('Database error while creating invoice'));
                    });
                    return;
                }

                const invoiceId = this.lastID;

                db.exec('COMMIT;', (commitErr) => {
                    if (commitErr) {
                        console.error('Error committing transaction:', commitErr);
                        db.exec('ROLLBACK;', () => {
                            reject(new Error('Database error while creating invoice'));
                        });
                        return;
                    }
                    resolve(invoiceId);
                });
            });
        });
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
