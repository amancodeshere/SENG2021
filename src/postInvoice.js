import { db } from './connect.js';
import { CustomInputError } from './errors.js';
import { UBLBuilder } from 'ubl-builder';
import { inputOrder } from './orderToDB.js';
import { inputInvoice } from './invoiceToDB.js';
import { v4 as uuidv4 } from 'uuid';
import { XMLParser } from 'fast-xml-parser';

/**
 * Validates the required fields in the document
 */
function validateDocument(document) {
    const requiredFields = ['SalesOrderID', 'IssueDate', 'PartyName', 'PayableAmount', 'CurrencyCode'];
    return requiredFields.every(field => document[field] !== undefined);
}

/**
 * Parses XML document using UBL standard
 */
function parseXMLDocument(xmlString) {
    if (!xmlString || typeof xmlString !== 'string') {
        throw new CustomInputError('Invalid XML document');
    }

    console.log("🔹 Raw XML received:", xmlString);

    try {
        // const ubl = new UBLBuilder();
        // const invoice = ubl.parseInvoiceXML(xmlString);

        // // Fix: Get payable amount text properly
        // const payableAmountElement = invoice.getLegalMonetaryTotal().getPayableAmount();
        // const payableAmount = payableAmountElement && payableAmountElement._text 
        //     ? parseFloat(payableAmountElement._text) 
        //     : NaN;
        
        // // Fix: Extract currency code properly
        // const currencyCode = payableAmountElement && payableAmountElement.currencyID
        //     ? payableAmountElement.currencyID 
        //     : undefined;

        // const document = {
        //     SalesOrderID: invoice.getOrderReference().getID(),
        //     IssueDate: invoice.getIssueDate(),
        //     PartyName: invoice.getAccountingCustomerParty().getParty().getPartyName().getName(),
        //     PayableAmount: payableAmount,
        //     CurrencyCode: currencyCode
        // };
        const options = {
            ignoreAttributes : false
        }; 
        const parser = new XMLParser(options);
        let orderObj = parser.parse(xmlString);
        // console.log(orderObj.Invoice);
        // for(var property in orderObj.Invoice) {
        //     console.log(property, orderObj.Invoice[property]);
        // }

        let invoiceObj = orderObj.Invoice;

        const document = {
            SalesOrderID: invoiceObj['cac:OrderReference']['cbc:ID'],
            IssueDate: invoiceObj['cbc:IssueDate'],
            PartyName: invoiceObj['cac:AccountingCustomerParty']['cac:Party']['cac:PartyName']['cbc:Name'],
            PayableAmount: invoiceObj['cac:LegalMonetaryTotal']['cbc:PayableAmount']['#text'],
            CurrencyCode: invoiceObj['cac:LegalMonetaryTotal']['cbc:PayableAmount']['@_currencyID']
        }
        
        console.log("✅ Parsed XML document:", document);

        if (!validateDocument(document)) {
            throw new CustomInputError('Missing required fields in document');
        }

        return document;
    } catch (error) {
        console.error("🔴 Error parsing XML:", error);
        throw new CustomInputError('Invalid XML document');
    }
}

/**
 * Creates an invoice using the order-first approach
 */
async function createInvoiceFromDocument(document) {
    return new Promise((resolve, reject) => {
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

        inputOrder(orderData.SalesOrderID, orderData.UUID, orderData.IssueDate, orderData.PartyName, orderData.PayableAmount, orderData.PayableCurrencyCode, orderData.Items, (orderErr) => {
            if (orderErr) {
                console.error('🔴 Error creating order:', orderErr);
                reject(new Error('Order creation failed'));
                return;
            }

            inputInvoice(orderData.SalesOrderID, (invoiceErr, result) => {
                if (invoiceErr) {
                    console.error('🔴 Error creating invoice:', invoiceErr);
                    reject(new Error('Invoice creation failed'));
                    return;
                }
                resolve(result.InvoiceID);
            });
        });
    });
}

/**
 * Handles the POST /api/invoice request
 */
export async function handlePostInvoice(req, res) {
    try {
        console.log("🔹 Received request for /api/invoice");

        const sessionId = req.headers['sessionid'];
        if (!sessionId) {
            return res.status(400).json({ error: 'Invalid session ID' });
        }

        console.log(`🔹 Checking session ID: ${sessionId}`);

        try {
            const validSession = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM sessions WHERE sessionId = ?', [sessionId], (err, row) => {
                    if (err) return reject(new Error('Database error while checking session'));
                    resolve(row);
                });
            });

            if (!validSession) {
                return res.status(400).json({ error: 'Invalid session ID' });
            }
        } catch (err) {
            return res.status(500).json({ error: 'Internal session validation error' });
        }

        let document;
        const contentType = req.headers['content-type'];
        console.log(`🔹 Content-Type received: ${contentType}`);

        try {
            if (contentType === 'application/xml') {
                document = parseXMLDocument(req.body);
            } else if (contentType === 'application/json') {
                console.log("🔹 Parsing JSON document", req.body);
                document = req.body;

                if (!validateDocument(document)) {
                    return res.status(400).json({ error: 'Missing required fields in document' });
                }
            } else {
                return res.status(400).json({ error: 'Invalid content type' });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            console.log("🔹 Creating invoice from document:", document);
            const invoiceId = await createInvoiceFromDocument(document);
            return res.status(200).json({ invoiceId });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}