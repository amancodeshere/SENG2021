import { MonetaryTotal } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/MonetaryTotalTypeGroup.js';
import { getInvoiceByID } from './invoiceToDB.js';
import { Invoice } from 'ubl-builder';
import { PartyName } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/PartyName.js';
import { Party } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/PartyTypeGroup.js';
import { AccountingSupplierParty } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/SupplierPartyTypeGroup.js';
import { AccountingCustomerParty } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/CustomerPartyTypeGroup.js';
import { InvoiceLine } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/InvoiceLineTypeGroup.js';
import { Item } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/ItemTypeGroup.js';
import { Price } from 'ubl-builder/lib/ubl21/CommonAggregateComponents/PriceTypeGroup.js';
import { db } from './connect.js';
import { CustomInputError } from './errors.js';

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
        invoice.setOrderReference({ salesOrderID: invoiceData.SalesOrderID });

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
 * Fetches invoices for the company associated with the given session ID.
 *
 * @param {number} sessionId - The session ID to validate user access.
 * @param {Function} callback - Callback function to handle the result.
 */
export function getInvoicesBySession(sessionId, callback) {
    if (!sessionId || typeof sessionId !== 'number') {
        return callback(new CustomInputError("Invalid session ID."));
    }

    // get UserID from session
    const sqlGetUserId = `SELECT UserID FROM sessions WHERE SessionID = ?;`;
    db.get(sqlGetUserId, [sessionId], (sessionErr, sessionRow) => {
        if (sessionErr) {
            console.error("SQL Error while fetching session:", sessionErr.message);
            return callback(new CustomInputError("Database error while fetching session."));
        }

        if (!sessionRow) {
            return callback(new CustomInputError("Invalid session. No user found."));
        }

        const userId = sessionRow.UserID;

        // get the user's company name
        const sqlGetCompany = `SELECT CompanyName FROM users WHERE UserID = ?;`;
        db.get(sqlGetCompany, [userId], (userErr, userRow) => {
            if (userErr) {
                console.error("SQL Error while fetching company name:", userErr.message);
                return callback(new CustomInputError("Database error while fetching company details."));
            }

            if (!userRow || !userRow.CompanyName) {
                return callback(new CustomInputError("User does not belong to a valid company."));
            }

            const companyName = userRow.CompanyName;

            // get invoices belonging to the users company
            const sqlQuery = `SELECT * FROM invoices WHERE PartyNameBuyer = ?;`;
            db.all(sqlQuery, [companyName], (invoiceErr, invoices) => {
                if (invoiceErr) {
                    console.error("SQL Error while fetching invoices:", invoiceErr.message);
                    return callback(new CustomInputError("Database error while fetching invoices."));
                }

                if (!invoices || invoices.length === 0) {
                    return callback(new CustomInputError("No invoices found for this company."));
                }

                callback(null, { companyName, invoices });
            });
        });
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