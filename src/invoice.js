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
function parseXMLDocument(xmlString) {
    const clean = xmlString
        .replace(/xmlns(:\w+)?="[^"]*"/g, '')
        .replace(/<\w+:(\w+)/g, '<$1')
        .replace(/<\/\w+:(\w+)/g, '</$1');

    let root;
    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
        });
        const json = parser.parse(clean);
        root = json.Order;
    } catch (e) {
        throw new CustomInputError('Invalid XML document');
    }

    if (!root) {
        throw new CustomInputError('Root <Order> element not found');
    }

    const lines = Array.isArray(root.OrderLine)
        ? root.OrderLine
        : [root.OrderLine];


    const items = lines.map(line => {
        const li = line.LineItem;
        return {
            OrderItemId:     uuidv4().slice(0,8),
            ItemName:        li.Item.Name,
            ItemDescription: li.Item.Description,
            ItemPrice:       parseFloat(li.Price.PriceAmount['#text']),
            ItemQuantity:    parseFloat(li.Quantity['#text']),
            ItemUnitCode:    li.Quantity['@_unitCode'],
        };
    });

    const doc = {
        IssueDate:     root.IssueDate,
        PartyName:     root.BuyerCustomerParty.Party.PartyName.Name,
        PayableAmount: parseFloat(root.AnticipatedMonetaryTotal.PayableAmount['#text']),
        CurrencyCode:  root.AnticipatedMonetaryTotal.PayableAmount['@_currencyID'],
        Items:         items
    };

    ['IssueDate','PartyName','PayableAmount','CurrencyCode','Items']
        .forEach(f => {
            if (doc[f] == null) {
                throw new CustomInputError(`Missing required field: ${f}`);
            }
        });

    return doc;
}

/**
 * Creates an invoice using the order-first approach
 */
async function createInvoiceFromDocument(document, sellerCompany) {
    return new Promise((resolve, reject) => {
        const SalesOrderID       = uuidv4().slice(0,8);
        const UUID               = uuidv4();
        const IssueDate          = document.IssueDate;
        const PartyNameBuyer     = document.PartyName;
        const PartyNameSeller    = sellerCompany;
        const PayableAmount      = parseFloat(document.PayableAmount);
        const PayableCurrencyCode= document.CurrencyCode;
        const Items = document.Items.map(item => ({
            OrderItemId:    uuidv4().slice(0,8),
            ItemName:       item.ItemName,
            ItemDescription:item.ItemDescription,
            ItemPrice:      parseFloat(item.ItemPrice),
            ItemQuantity:   parseFloat(item.ItemQuantity),
            ItemUnitCode:   item.ItemUnitCode
        }));

        inputOrder(
            SalesOrderID,
            UUID,
            IssueDate,
            PartyNameBuyer,
            PartyNameSeller,
            PayableAmount,
            PayableCurrencyCode,
            Items,
            (orderErr, orderRes) => {
                if (orderErr) return reject(new Error("Order creation failed"));
                inputInvoice(
                    SalesOrderID,
                    (invErr, invRes) => {
                        if (invErr) return reject(new Error("Invoice creation failed"));
                        resolve(invRes.InvoiceID);
                    }
                );
            }
        );
    });
}

// ===========================================================================
// ============================ main functions ===============================
// ===========================================================================

/**
 * GET /api/v2/invoices/list
 *
 * - sessionid header must be a valid session
 * - query.partyNameBuyer is trimmed + un‑quoted + validated
 * - calls your existing listInvoices(partyNameBuyer, callback)
 */
export async function handleListInvoices(req, res) {
    const sessionId = parseInt(req.headers['sessionid'], 10);
    if (isNaN(sessionId)) {
        return res.status(401).json({ error: 'Invalid session ID' });
    }

    let sellerCompany;
    try {
        const { rows } = await db.query(
            `SELECT u.companyname
         FROM sessions s
         JOIN users    u ON s.userid = u.userid
        WHERE s.sessionid = $1`,
            [sessionId]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid session ID' });
        }
        sellerCompany = rows[0].companyname;
    } catch (err) {
        console.error('Session/user lookup error:', err);
        return res
            .status(500)
            .json({ error: 'Internal session/user validation error' });
    }

    let buyer = req.query.partyNameBuyer;
    if (!buyer) {
        return res.status(400).json({ error: 'Missing partyNameBuyer parameter' });
    }
    buyer = buyer.trim();
    if (buyer.startsWith('"') && buyer.endsWith('"')) {
        buyer = buyer.slice(1, -1);
    }
    if (!isValidPartyName(buyer)) {
        return res
            .status(400)
            .json({ error: 'partyNameBuyer contains invalid characters.' });
    }

    try {
        listInvoices(buyer, (err, invoices) => {
            if (err) {
                console.error('List invoices DB error:', err);
                return res
                    .status(400)
                    .json({ error: 'Database error while listing invoices.' });
            }
            return res.status(200).json(invoices);
        });
    } catch (err) {
        console.error('Unexpected error in listInvoices handler:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

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

        try {
            const invoice = new Invoice(invoiceId, {});

            const supplierPartyName = new PartyName({ name: companyName });
            invoice.setAccountingSupplierParty(
                new AccountingSupplierParty({
                    party: new Party({ partyNames: [supplierPartyName] })
                })
            );

            const customerPartyName = new PartyName({ name: invoiceData.partynamebuyer });
            invoice.setAccountingCustomerParty(
                new AccountingCustomerParty({
                    party: new Party({ partyNames: [customerPartyName] })
                })
            );

            const currencyAttr = { currencyID: invoiceData.currencycode };
            invoice.setLegalMonetaryTotal(
                new MonetaryTotal({
                    payableAmount: new UdtAmount(invoiceData.payableamount, currencyAttr)
                })
            );

            let lineId = 1;
            invoiceData.Items.forEach(item => {
                const lineItem = new Item({
                    name: item.invoiceitemname,
                    descriptions: item.itemdescription
                });
                const lineAmount = new UdtAmount(
                    item.itemprice * item.itemquantity,
                    currencyAttr
                );
                const price = new Price({
                    priceAmount: new UdtAmount(item.itemprice, currencyAttr)
                });
                const qty = new UdtQuantity(item.itemquantity, {
                    unitCode: item.itemunitcode
                });

                invoice.addInvoiceLine(
                    new InvoiceLine({
                        id: lineId++,
                        price,
                        invoicedQuantity: qty,
                        lineExtensionAmount: lineAmount,
                        item: lineItem
                    })
                );
            });

            const xml = invoice.getXml();
            callback(null, xml);
        } catch (e) {
            console.error("Error generating XML invoice:", e.message);
            callback(new CustomInputError("Error generating XML invoice."));
        }
    });
}

/**
 * @description Find an invoice using its invoiceId and return information about it.
 * @param {number} invoiceId 
 * @param {function} callback 
 */
export function viewInvoice(invoiceId, callback) {
    getInvoiceByID(invoiceId, (err, invoiceData) => {
        if (err) return callback(err);

        const currency= invoiceData.CurrencyCode ?? invoiceData.currencycode;
        const rawPayable= invoiceData.PayableAmount ?? invoiceData.payableamount;
        const lines = invoiceData.Items ?? [];

        const items = lines.map(it => {
            const priceVal = it.ItemPrice ?? it.itemprice;
            const qtyVal = it.ItemQuantity ?? it.itemquantity;
            const unitCode = it.ItemUnitCode ?? it.itemunitcode;

            return {
                name:        it.ItemName        ?? it.invoiceitemname,
                description: it.ItemDescription ?? it.itemdescription,
                price:       `${currency} ${priceVal}`,
                quantity:    `${qtyVal} ${unitCode}`,
            };
        });

        const total = rawPayable != null
            ? rawPayable
            : lines.reduce((sum, it) => {
                const p = Number(it.ItemPrice ?? it.itemprice);
                const q = Number(it.ItemQuantity ?? it.itemquantity);
                return sum + (p * q);
            }, 0);

        callback(null, {
            invoiceId:      invoiceData.InvoiceID  ?? invoiceData.invoiceid,
            issueDate:      invoiceData.IssueDate  ?? invoiceData.issuedate,
            partyNameBuyer: invoiceData.PartyNameBuyer ?? invoiceData.partynamebuyer,
            payableAmount:  `${currency} ${total}`,
            items,
        });
    });
}


/**
 * @decsription Find a list of invoices for partyNameBuyer and return it.
 * @param {string} partyNameBuyer 
 * @param {function} callback 
 */
export function listInvoices(partyNameBuyer, callback) {
    if (!isValidPartyName(partyNameBuyer)) {
        return callback(new CustomInputError("partyNameBuyer contains invalid characters."));
    }

    const sql = `
    SELECT
      i.invoiceid AS invoiceid,
      i.issuedate AS issuedate,
      i.partynamebuyer AS partynamebuyer,
      o.payableamount AS payableamount,
      o.payablecurrencycode AS payablecurrencycode
    FROM invoices i
    JOIN orders o
      ON i.salesorderid = o.salesorderid
    WHERE i.partynamebuyer = $1;
  `;

    db.query(sql, [partyNameBuyer])
        .then(result => {
            const invoicesList = result.rows.map(row => ({
                invoiceId: row.invoiceid,
                issueDate: row.issuedate,
                partyNameBuyer: row.partynamebuyer,
                payableAmount: `${row.payablecurrencycode} ${row.payableamount}`,
            }));
            callback(null, invoicesList);
        })
        .catch(err => {
            console.error("List invoices DB error:", err.message);
            callback(new CustomInputError("Database error while listing invoices."));
        });
}

/**
 * POST /api/v2/invoice/create
 * - headers:
 *    • sessionid: <number>
 *    • content-type: application/xml
 * - body: a UBL `<Order>` XML string or equivalent JSON
 */
export async function handlePostInvoice(req, company, callback) {
    let document;
    const ct = req.headers['content-type'];
    try {
        if (ct === 'application/xml') {
            document = parseXMLDocument(req.body);
        } else if (ct === 'application/json') {
            document = req.body;
            if (!document.IssueDate || !document.PartyName || !document.PayableAmount || !document.CurrencyCode || !Array.isArray(document.Items)) {
                return callback(new CustomInputError('Missing required fields in JSON payload'));
            }
        } else {
            return callback( new Error('Invalid content type'));
        }
    } catch (err) {
        return callback(new Error("error parsing document"));
    }

    try {
        const invoiceId = await createInvoiceFromDocument(document, company);
        return callback(null, { invoiceId });
    } catch (err) {
        return callback(err);
    }
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
