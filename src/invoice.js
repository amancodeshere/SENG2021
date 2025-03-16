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
