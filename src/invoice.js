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

// ===========================================================================
// ============== local helper functions only used in admin.js ===============
// ===========================================================================

/**
 * Validates the required fields in the document
 */
function validateDocument(document) {
    const requiredFields = ['IssueDate', 'PartyName', 'PayableAmount', 'CurrencyCode'];
    return requiredFields.every(field => document[field] !== undefined);
}

/**
 * Parses XML document using UBL standard
 */
function parseXMLDocument(xmlString) {
    try {
        const options = {
            ignoreAttributes : false
        }; 
        const parser = new XMLParser(options);
        let orderObj = parser.parse(xmlString).Order;

        console.log(orderObj);

        var items = parseXMLItemsList(orderObj["cac:OrderLine"]);

        const document = {
            IssueDate: orderObj['cbc:IssueDate'],
            PartyName: orderObj['cac:BuyerCustomerParty']['cac:Party']['cac:PartyName']['cbc:Name'],
            PayableAmount: orderObj['cac:AnticipatedMonetaryTotal']['cbc:PayableAmount']['#text'],
            CurrencyCode: orderObj['cac:AnticipatedMonetaryTotal']['cbc:PayableAmount']['@_currencyID'],
            Items: items
        }
        
        console.log(document)
        if (!validateDocument(document)) {
            throw new CustomInputError('Missing required fields in document');
        }

        return document;
    } catch (error) {
        throw new CustomInputError('Invalid XML document');
    }
}

function parseXMLItemsList(xmlItems) {
    var items = [];
    for(var orderLine of xmlItems) {
        var xmlItem = orderLine['cac:LineItem'];
        console.log(xmlItem);
        const item = {
            Id: xmlItem['cbc:ID'],
            ItemName: xmlItem['cac:Item']['cbc:Name'],
            ItemDescription: xmlItem['cac:Item']['cbc:Description'],
            ItemAmount: xmlItem['cac:Price']['cbc:PriceAmount']['#text'],
            ItemUnitCode: xmlItem['cbc:Quantity']['@_unitCode']
        };
       items.push(item);
    }
    return items;
}

/**
 * Creates an invoice using the order-first approach
 */
async function createInvoiceFromDocument(document) {
    return new Promise((resolve, reject) => {
        const orderData = {
            UUID: uuidv4(),
            IssueDate: document.IssueDate,
            PartyName: document.PartyName,
            PayableAmount: document.PayableAmount,
            PayableCurrencyCode: document.CurrencyCode,
            Items: document.Items
        };

        inputOrder(orderData.UUID, orderData.IssueDate, orderData.PartyName, orderData.PayableAmount, orderData.PayableCurrencyCode, orderData.Items, (orderErr) => {
            if (orderErr) {
                reject(new Error('Order creation failed'));
                return;
            }

            inputInvoice(orderData.SalesOrderID, (invoiceErr, result) => {
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

        const monetaryTotal = new MonetaryTotal({ payableAmount: invoiceData.PayableAmount });
        invoice.setLegalMonetaryTotal(monetaryTotal);

        const numItems = invoiceData.Items.length
        let id = 1;
        invoiceData.Items.forEach((item) => {
            const invoiceItem = new Item({ name: item.ItemDescription });
            const lineExtensionAmount = invoiceData.PayableAmount / numItems;
            const invoiceLine = new InvoiceLine({ id, invoicedQuantity: item.ItemAmount, lineExtensionAmount, item: invoiceItem });
            invoice.addInvoiceLine(invoiceLine);
            id++;
        });

        

        const xmlInvoice = invoice.getXml();

        callback(null, xmlInvoice);
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
                description: item.ItemDescription,
                amount: `${item.ItemAmount} ${item.ItemUnitCode}`,
            });
        });

        callback(null, {
            invoiceId: invoice.InvoiceID,
            salesOrderID: parseInt(invoice.SalesOrderID),
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
                salesOrderID: parseInt(invoice.SalesOrderID),
                issueDate: invoice.IssueDate,
                partyNameBuyer: partyNameBuyer,
                payableAmount: `${invoice.CurrencyCode} ${invoice.PayableAmount}`,
            });
        });

        callback(null, invoicesList);
    });
}

/**
 * @description Handles the POST /api/invoice request
 */
export async function handlePostInvoice(req, res) {
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
                document = parseXMLDocument(req.body);
            } else if (contentType === 'application/json') {
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
            const invoiceId = await createInvoiceFromDocument(document);
            return res.status(200).json({ invoiceId });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
