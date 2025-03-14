import { getInvoiceByID } from './invoiceToDB.js';
import { Invoice } from 'ubl-builder';

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
        // const supplierPartyName = new PartyName({ companyName });
        // const supplierParty = new Party({ partyNames: [supplierPartyName] });
        // const accountingSupplierParty = new AccountingSupplierParty({ party: supplierParty });
        // invoice.setAccountingSupplierParty(accountingSupplierParty);
        // invoice.setAccountingCustomerParty(invoiceData.PartyNameBuyer);
        // invoice.setLegalMonetaryTotal(invoiceData.PayableAmount);
        // invoice.addInvoiceLine

        const xmlInvoice = invoice.getXml();

        callback(null, xmlInvoice);
    });
}
