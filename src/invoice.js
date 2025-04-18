import { MonetaryTotal } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/MonetaryTotalTypeGroup.js';
import { getInvoiceByID, getInvoicesByCompanyName, inputInvoice } from './invoiceToDB.js';
import { inputOrder } from './orderToDB.js';
import { isValidPartyName } from './helperFunctions.js';
import { Invoice } from 'ubl-builder';
import { PartyName } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/PartyName.js';
import { Party } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/PartyTypeGroup.js';
import { AccountingSupplierParty } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/SupplierPartyTypeGroup.js';
import { AccountingCustomerParty } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/CustomerPartyTypeGroup.js';
import { InvoiceLine } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/InvoiceLineTypeGroup.js';
import { Item } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/ItemTypeGroup.js';
import xsdValidator from 'xsd-schema-validator';
import { validate } from 'schematron-runner';
import {CustomInputError} from "./errors.js";
import { db } from './connect.js';
import { v4 as uuidv4 } from 'uuid';
import { XMLParser } from 'fast-xml-parser';
import { Price } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/PriceTypeGroup.js';
import { UdtQuantity } from 'ubl-builder/lib/ubl21/types/UnqualifiedDataTypes/UdtQuantity.js';
import { UdtAmount } from 'ubl-builder/lib/ubl21/types/UnqualifiedDataTypes/UdtAmount.js';

// ===========================================================================
// ============== local helper functions only used in invoice.js =============
// ===========================================================================

/**
 * Validates the required fields in the document
 */
function validateDocument(document) {
    const requiredFields = ['IssueDate', 'PartyName', 'PayableAmount', 'CurrencyCode', 'Items'];
    return requiredFields.every(field => document[field] !== undefined);
}

/**
 * Parses XML document using UBL standard
 */
export function parseXMLDocument(xml) {
    try {
        const parser = new XMLParser({ ignoreAttributes: false });
        const orderObj = parser.parse(xml).Order;
        const items   = orderObj["cac:OrderLine"].map(line => {
            const li = line['cac:LineItem'];
            return {
                OrderItemId: uuidv4().slice(0,8),
                ItemName:        li['cac:Item']['cbc:Name'],
                ItemDescription: li['cac:Item']['cbc:Description'],
                ItemPrice:       parseFloat(li['cac:Price']['cbc:PriceAmount']['#text']),
                ItemQuantity:    parseFloat(li['cbc:Quantity']['#text']),
                ItemUnitCode:    li['cbc:Quantity']['@_unitCode']
            };
        });

        const doc = {
            IssueDate:        orderObj['cbc:IssueDate'],
            PartyName:        orderObj['cac:BuyerCustomerParty']['cac:Party']['cac:PartyName']['cbc:Name'],
            PayableAmount:    parseFloat(orderObj['cac:AnticipatedMonetaryTotal']['cbc:PayableAmount']['#text']),
            CurrencyCode:     orderObj['cac:AnticipatedMonetaryTotal']['cbc:PayableAmount']['@_currencyID'],
            Items:            items
        };

        // minimal required‑fields check
        ['IssueDate','PartyName','PayableAmount','CurrencyCode','Items']
            .forEach(f => {
                if (doc[f] == null) throw new CustomInputError(`Missing ${f}`);
            });

        return doc;
    } catch (e) {
        throw e instanceof CustomInputError
            ? e
            : new CustomInputError('Invalid XML document');
    }
}

/**
 * Creates an invoice using the order-first approach
 */
export function createInvoiceFromDocument(document, sellerCompany) {
    return new Promise((resolve, reject) => {
        const salesOrderId = uuidv4().slice(0,8);
        const orderPayload = {
            SalesOrderID:       salesOrderId,
            UUID:               uuidv4(),
            IssueDate:          document.IssueDate,
            PartyNameBuyer:     document.PartyName,
            PartyNameSeller:    sellerCompany,
            PayableAmount:      document.PayableAmount,
            PayableCurrencyCode:document.CurrencyCode,
            Items:              document.Items
        };


        inputOrder(
            orderPayload.SalesOrderID,
            orderPayload.UUID,
            orderPayload.IssueDate,
            orderPayload.PartyNameBuyer,
            orderPayload.PartyNameSeller,
            orderPayload.PayableAmount,
            orderPayload.PayableCurrencyCode,
            orderPayload.Items,
            (orderErr, orderResult) => {
                if (orderErr) {
                    return reject(new Error('Order creation failed: ' + orderErr.message));
                }
                // now create the invoice record
                inputInvoice(orderPayload.SalesOrderID, (invErr, invRes) => {
                    if (invErr) {
                        return reject(new Error('Invoice creation failed: ' + invErr.message));
                    }
                    resolve(invRes.InvoiceID);
                });
            }
        );
    });
}

// ===========================================================================
// ============================ main functions ===============================
// ===========================================================================

/**
 * @description Converts invoice with the given invoiceid to UBL 2.1 XML format and returns it.
 * @param {number} invoiceId 
 * @param {string} companyName 
 * @param {function} callback 
 */
export function invoiceToXml(invoiceId, companyName, callback) {
    getInvoiceByID(invoiceId, (err, invoiceData) => {
        if (err) {
            return callback(err);
        }

        const invoice = new Invoice(invoiceId, {});
        invoice.addProperty('xmlns', 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2');
        invoice.addProperty('xmlns:cac', 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2');
        invoice.addProperty('xmlns:cbc', 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2');

        invoice.setIssueDate(invoiceData.IssueDate);
        invoice.setDocumentCurrencyCode(invoiceData.CurrencyCode);

        const supplierPartyName = new PartyName({ name: companyName });
        const supplierParty = new Party({ partyNames: [supplierPartyName] });
        const accountingSupplierParty = new AccountingSupplierParty({ party: supplierParty })
        invoice.setAccountingSupplierParty(accountingSupplierParty);

        const customerPartyName = new PartyName({ name: invoiceData.PartyNameBuyer });
        const customerParty = new Party({ partyNames: [customerPartyName] });
        const accountingCustomerParty = new AccountingCustomerParty({ party: customerParty })
        invoice.setAccountingCustomerParty(accountingCustomerParty);

        const currencyAttribute = { currencyID: invoiceData.CurrencyCode };
        const monetaryTotal = new MonetaryTotal({ payableAmount: new UdtAmount(invoiceData.PayableAmount, currencyAttribute) });
        invoice.setLegalMonetaryTotal(monetaryTotal);

        let id = 1;
        invoiceData.Items.forEach((item) => {
            const invoiceItem = new Item({ name: item.ItemName, descriptions: item.ItemDescription });
            const lineExtensionAmount = new UdtAmount(item.ItemPrice * item.ItemQuantity, currencyAttribute);
            const itemPrice = new Price({ priceAmount: new UdtAmount(item.ItemPrice, currencyAttribute) })
            const itemQuantity = new UdtQuantity(item.ItemQuantity, { unitCode: item.ItemUnitCode })
            const invoiceLine = new InvoiceLine({ id, price: itemPrice, invoicedQuantity: itemQuantity ,lineExtensionAmount, item: invoiceItem});
            invoice.addInvoiceLine(invoiceLine);
            id++;
        });   

        const xmlInvoice = invoice.getXml();

        return callback(null, xmlInvoice);
    });
}

/**
 * @description Find an invoice using its invoiceId and return information about it.
 * @param {number} invoiceId 
 * @param {function} callback 
 */
export function viewInvoice(invoiceId, callback) {
    getInvoiceByID(invoiceId, (err, invoice) => {
        if (err) {
            return callback(err);
        }

        const items = [];
        invoice.Items.forEach((item) => {
            items.push({
                name: item.ItemName,
                description: item.ItemDescription,
                price: `${invoice.CurrencyCode} ${item.ItemPrice}`,
                quantity: `${item.ItemQuantity} ${item.ItemUnitCode}`
            });
        });

        callback(null, {
            invoiceId: invoice.InvoiceID,
            issueDate: invoice.IssueDate,
            partyNameBuyer: invoice.PartyNameBuyer,
            payableAmount: `${invoice.CurrencyCode} ${invoice.PayableAmount}`,
            items: items
        });
    });
}

/**
 * @description Submits an invoice for validation. Validates that invoice in XML matches UBL formatting and schema.
 * @param {String} invoice - The XML invoice to validate
 * @param {Function} callback - Callback function to handle the result.
 */
export async function validateInvoice(invoice, callback) {
    try {
        //Validates against the UBL Invoice XSD schema
        await xsdValidator.validateXML(invoice, 'schemas/ubl/xsd/maindoc/UBL-Invoice-2.1.xsd');
        // Validates against the AUNZ-PEPPOL schematron
        await validate(invoice, 'schemas/ANZ-PEPPOL/AUNZ-PEPPOL-validation.sch');
    } catch (err) {
        console.error(err.messages)
        return callback({ validated: false, message: err.messages[0]});
    }

    return callback({ validated: true, message: "Valid invoice"});

}

/**
 * @decsription Find a list of invoices for partyNameBuyer and return it.
 * @param {string} partyNameBuyer 
 * @param {function} callback 
 */
export function listInvoices(partyNameBuyer, callback) {
    if(!isValidPartyName(partyNameBuyer)) {
        return callback(new CustomInputError("partyNameBuyer contains invalid characters."));
    }

    getInvoicesByCompanyName(partyNameBuyer, (err, result) => {
        const invoicesList = [];

        if (err) {
            if (err.message === "No invoices found for this company.") {
                return callback(null, invoicesList);
            }
            return callback(err);
        }

        result.forEach((invoice) => {
            invoicesList.push({
                invoiceId: invoice.InvoiceID,
                issueDate: invoice.IssueDate,
                partyNameBuyer: partyNameBuyer,
                payableAmount: `${invoice.CurrencyCode} ${invoice.PayableAmount}`,
            });
        });

        callback(null, invoicesList);
    });
}

/**
 * POST /api/v2/invoice/create
 * - headers:
 *    • sessionid: <number>
 *    • content-type: application/xml
 * - body: a UBL `<Order>` XML string
 */
export async function handlePostInvoice(req, res) {
    const sessionId = parseInt(req.headers.sessionid, 10);
    if (isNaN(sessionId)) {
        return res.status(401).json({ error: 'Invalid session ID' });
    }

    // 1) verify & load session → find user → grab companyName
    let userCompany;
    try {
        const sessionRow = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM sessions WHERE sessionid = ?', [sessionId], (err, row) => {
                if (err) return reject(new Error('Database error while checking session'));
                resolve(row);
            });
        });
        if (!sessionRow) {
            return res.status(401).json({ error: 'Invalid session ID' });
        }

        const userRow = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM users WHERE userid = ?', [sessionRow.userid], (err, row) => {
                if (err) return reject(new Error('Database error while retrieving user'));
                resolve(row);
            });
        });
        if (!userRow) {
            return res.status(400).json({ error: 'User or company not found' });
        }
        userCompany = userRow.companyname;
    } catch (err) {
        return res.status(500).json({ error: 'Internal session/user validation error' });
    }

    // 2) parse & validate the incoming document
    let document;
    const ct = req.headers['content-type'];
    try {
        if (ct === 'application/xml') {
            document = parseXMLDocument(req.body);
        } else if (ct === 'application/json') {
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

    // 3) create order -> create invoice
    try {
        const invoiceId = await createInvoiceFromDocument(document, userCompany);
        return res.status(200).json({ invoiceId });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}


// ===========================================================================
// ========================== outdated v1 helpers ============================
// ===========================================================================

/**
 * Validates the required fields in the document
 */
function v1validateDocument(document) {
    const requiredFields = ['SalesOrderID', 'IssueDate', 'PartyName', 'PayableAmount', 'CurrencyCode'];
    return requiredFields.every(field => document[field] !== undefined);
}

/**
 * Parses XML document using UBL standard
 */
function v1parseXMLDocument(xmlString) {
    try {
    const options = {
        ignoreAttributes : false
    }; 
    const parser = new XMLParser(options);
    let orderObj = parser.parse(xmlString);

    let invoiceObj = orderObj.Invoice;

    const document = {
        SalesOrderID: invoiceObj['cac:OrderReference']['cbc:ID'],
        IssueDate: invoiceObj['cbc:IssueDate'],
        PartyName: invoiceObj['cac:AccountingCustomerParty']['cac:Party']['cac:PartyName']['cbc:Name'],
        PayableAmount: invoiceObj['cac:LegalMonetaryTotal']['cbc:PayableAmount']['#text'],
        CurrencyCode: invoiceObj['cac:LegalMonetaryTotal']['cbc:PayableAmount']['@_currencyID']
    }
    
    if (!v1validateDocument(document)) {
        throw new CustomInputError('Missing required fields in document');
    }

    return document;
} catch (error) {
    throw new CustomInputError('Invalid XML document');
}
}

/**
* Creates an invoice using the order-first approach
*/
async function v1createInvoiceFromDocument(document) {
    return new Promise((resolve, reject) => {
        const orderData = {
            UUID: uuidv4(),
            IssueDate: document.IssueDate,
            PartyName: document.PartyName,
            PayableAmount: document.PayableAmount,
            PayableCurrencyCode: document.CurrencyCode,
            Items: [{
                ItemDescription: "Default Item",
                ItemPrice: document.PayableAmount,
                ItemQuantity: 1,
                ItemUnitCode: "EA"
            }]
        };

        inputOrder(orderData.UUID, orderData.IssueDate, orderData.PartyName, orderData.PayableAmount, orderData.PayableCurrencyCode, orderData.Items, (orderErr, result) => {
            if (orderErr) {
                reject(new Error('Order creation failed'));
                return;
            }

            inputInvoice(result.OrderID, (invoiceErr, result) => {
                if (invoiceErr) {
                    reject(new Error('Invoice creation failed'));
                    return;
                }
                resolve(result.InvoiceID);
            });
        });
    });
}


// ===========================================================================
// ========================== outdated v1 routes =============================
// ===========================================================================

/**
 * @decsription Find a list of invoices for partyNameBuyer and return it.
 * @param {string} partyNameBuyer 
 * @param {function} callback 
 */
export function v1listInvoices(partyNameBuyer, callback) {
    if(!isValidPartyName(partyNameBuyer)) {
        return callback(new CustomInputError("partyNameBuyer contains invalid characters."));
    }

    getInvoicesByCompanyName(partyNameBuyer, (err, result) => {
        const invoicesList = [];

        if (err) {
            if (err.message === "No invoices found for this company.") {
                return callback(null, invoicesList);
            }
            return callback(err);
        }

        result.forEach((invoice) => {
            invoicesList.push({
                invoiceId: invoice.InvoiceID,
                salesOrderID: 123456,
                issueDate: invoice.IssueDate,
                partyNameBuyer: partyNameBuyer,
                payableAmount: `${invoice.CurrencyCode} ${invoice.PayableAmount}`,
            });
        });

        callback(null, invoicesList);
    });
}

/**
 * @description Find an invoice using its invoiceId and return information about it.
 * @param {number} invoiceId 
 * @param {function} callback 
 */
export function v1viewInvoice(invoiceId, callback) {
    getInvoiceByID(invoiceId, (err, invoice) => {
        if (err) {
            return callback(err);
        }

        const items = [];
        invoice.Items.forEach((item) => {
            items.push({
                description: item.ItemDescription,
                amount: `5 ${item.ItemUnitCode}`,
            });
        });

        callback(null, {
            invoiceId: invoice.InvoiceID,
            salesOrderID: 12345678,
            issueDate: invoice.IssueDate,
            partyNameBuyer: invoice.PartyNameBuyer,
            payableAmount: `${invoice.CurrencyCode} ${invoice.PayableAmount}`,
            items: items
        });
    });
}

/**
 * @description Converts invoice with the given invoiceid to UBL 2.1 XML format and returns it.
 * @param {number} invoiceId 
 * @param {string} companyName 
 * @param {function} callback 
 */
export function v1invoiceToXml(invoiceId, companyName, callback) {
    getInvoiceByID(invoiceId, (err, invoiceData) => {
        if (err) {
            return callback(err);
        }

        const invoice = new Invoice(invoiceId, {});
        invoice.addProperty('xmlns', 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2');
        invoice.addProperty('xmlns:cac', 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2');
        invoice.addProperty('xmlns:cbc', 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2');

        invoice.setIssueDate(invoiceData.IssueDate);
        invoice.setDocumentCurrencyCode(invoiceData.CurrencyCode);
        invoice.setOrderReference({ salesOrderID: 123456 });

        const supplierPartyName = new PartyName({ name: companyName });
        const supplierParty = new Party({ partyNames: [supplierPartyName] });
        const accountingSupplierParty = new AccountingSupplierParty({ party: supplierParty })
        invoice.setAccountingSupplierParty(accountingSupplierParty);

        const customerPartyName = new PartyName({ name: invoiceData.PartyNameBuyer });
        const customerParty = new Party({ partyNames: [customerPartyName] });
        const accountingCustomerParty = new AccountingCustomerParty({ party: customerParty })
        invoice.setAccountingCustomerParty(accountingCustomerParty);

        const monetaryTotal = new MonetaryTotal({ payableAmount: invoiceData.PayableAmount });
        invoice.setLegalMonetaryTotal(monetaryTotal);

        const numItems = invoiceData.Items.length
        let id = 1;
        invoiceData.Items.forEach((item) => {
            const invoiceItem = new Item({ name: item.ItemDescription });
            const lineExtensionAmount = invoiceData.PayableAmount / numItems;
            const invoiceLine = new InvoiceLine({ id, invoicedQuantity: item.ItemQuantity, lineExtensionAmount, item: invoiceItem });
            invoice.addInvoiceLine(invoiceLine);
            id++;
        });

        const xmlInvoice = invoice.getXml();

        callback(null, xmlInvoice);
    });
}

/**
 * @description Handles the POST /api/invoice request
 */
export async function v1handlePostInvoice(req, res) {
    try {
        const sessionId = req.headers['sessionid'];
        if (!sessionId) {
            return res.status(401).json({ error: 'Invalid session ID' });
        }

        try {
            const validSession = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM sessions WHERE sessionId = ?', [sessionId], (err, row) => {
                    if (err) return reject(new Error('Database error while checking session'));
                    resolve(row);
                });
            });

            if (!validSession) {
                return res.status(401).json({ error: 'Invalid session ID' });
            }
        } catch (err) {
            return res.status(500).json({ error: 'Internal session validation error' });
        }

        let document;
        const contentType = req.headers['content-type'];

        try {
            if (contentType === 'application/xml') {
                document = v1parseXMLDocument(req.body);
            } else if (contentType === 'application/json') {
                document = req.body;

                if (!v1validateDocument(document)) {
                    return res.status(400).json({ error: 'Missing required fields in document' });
                }
            } else {
                return res.status(400).json({ error: 'Invalid content type' });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const invoiceId = await v1createInvoiceFromDocument(document);
            return res.status(200).json({ invoiceId });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}


/**
 * Updates a field on an invoice record by ID.
 * @param {number} invoiceId - ID of the invoice to update.
 * @param {string} toUpdate - Field to update (e.g., 'PayableAmount').
 * @param {string|number} newData - New value to set.
 * @param {string} company - Optional company ownership validation.
 * @param {function} callback - Callback function (err, result)
 */
export function updateInvoice(invoiceId, toUpdate, newData, company, callback) {
    const allowedFields = ['PayableAmount', 'CurrencyCode', 'IssueDate'];


    if (!allowedFields.includes(toUpdate)) {
        return callback(new CustomInputError('Invalid field for update.'));
    }


    if (newData === undefined || newData === null || newData === '') {
        return callback(new CustomInputError('New data value required.'));
    }


    const query = `UPDATE invoices SET ${toUpdate} = $1 WHERE invoiceid = $2 RETURNING *;`;


    db.query(query, [newData, invoiceId])
        .then(result => {
            if (!result.rowCount) {
                return callback(new CustomInputError('Invoice not found or update failed.'));
            }
            callback(null, { message: 'Invoice updated successfully.' });
        })
        .catch(err => {
            console.error('Invoice update DB error:', err.message);
            callback(new CustomInputError('Database error during invoice update.'));
        });
}
