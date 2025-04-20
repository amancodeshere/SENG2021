import request from 'supertest';
import { app } from '../../app.js';
import { getInvoiceByID } from '../../invoiceToDB.js';
import { getUserBySessionId } from '../../UsersToDB.js';
import { CustomInputError } from '../../errors.js';

jest.mock('../../UsersToDB.js', () => ({
    getUserBySessionId: jest.fn()
}));

jest.mock('../../invoiceToDB.js', () => ({
    getInvoiceByID: jest.fn()
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('invoiceToXml route - Comprehensive Tests', () => {
    const mockInvoice = {
        invoiceid: 123456,
        issuedate: '2025-03-06',
        partynamebuyer: 'ABC Corp',
        partynameseller: 'Seller Co',
        currencycode: 'USD',
        salesorderid: 123456
    };

    const mockItems = [
        {
            invoiceitemname: 'Item',
            itemdescription: 'Electronic Component',
            buyersitemidentification: 1,
            sellersitemidentification: 2,
            itemprice: 10,
            itemquantity: 1,
            itemunitcode: 'PCS'
        },
    ];

    describe('Testing successful invoiceToXml', () => {
        const mockInvoice2 = {
            invoiceid: 234567,
            issuedate: "2025-03-06",
            partynamebuyer: "ABC Corp",
            partynameseller: "Seller Co",
            currencycode: "USD",
            salesorderid: 123456
        };
        const mockItems2 = [
            {
                invoiceitemname: "Item",
                itemdescription: "Electronic Component",
                buyersitemidentification: 1,
                sellersitemidentification: 2,
                itemprice: 5,
                itemquantity: 1,
                itemunitcode: "PCS",
            },
            {
                invoiceitemname: "Item2",
                itemdescription: "Battery Component",
                buyersitemidentification: 1,
                sellersitemidentification: 2,
                itemprice: 15,
                itemquantity: 1,
                itemunitcode: "PCS",
            }
        ];

        test('Correct return value', async () => {
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                callback(null, {
                    userId: 1,
                    email: "abc@gmail.com",
                    company: "ABC Pty Ltd"
                });
            });
            getInvoiceByID.mockImplementationOnce((InvoiceID, callback) => {
                callback(null, { ...mockInvoice, Items: mockItems });
            });
            const res = await request(app)
                .get('/api/v2/invoice/123456/xml')
                .set('sessionid', '123');
            expect(typeof res.text).toBe('string');
            expect(res.status).toBe(200);
            expect(res.text).toContain('<?xml version="1.0" encoding="UTF-8"');
            expect(res.text).toContain('<Invoice');
            expect(res.text).toContain('<cbc:ID>123456</');
            expect(res.text).toContain('<cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>ABC Pty Ltd</');
            expect(res.text).toContain('<cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>ABC Corp</');
            expect(res.text).toContain('<cac:LegalMonetaryTotal><cbc:PayableAmount currencyID=\"USD\"');
            expect(res.text).toContain('<cac:InvoiceLine><cbc:ID>1</');
            expect(res.text).toContain('<cbc:InvoicedQuantity unitCode=\"PCS\">1</');
            expect(res.text).toContain('<cbc:LineExtensionAmount currencyID="USD">10</');
            expect(res.text).toContain('<cac:Item><cbc:Description>Electronic Component</cbc:Description><cbc:Name>Item</');
            expect(res.text).toContain('<cac:Price><cbc:PriceAmount currencyID=\"USD\">10</');
        });

        test('Converting an invoice with multiple items to XML successfully', async () => {
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                callback(null, {
                    userId: 1,
                    email: "abc@gmail.com",
                    company: "ABC Pty Ltd"
                });
            });
            getInvoiceByID.mockImplementationOnce((InvoiceID, callback) => {
                callback(null, { ...mockInvoice2, Items: mockItems2 });
            });
            const res = await request(app)
                .get('/api/v2/invoice/234567/xml')
                .set('sessionid', '123');
            expect(typeof res.text).toBe('string');
            expect(res.status).toBe(200);
            expect(res.text).toContain('<?xml version="1.0" encoding="UTF-8"');
            expect(res.text).toContain('<Invoice');
            expect(res.text).toContain('<cbc:ID>234567</');
            expect(res.text).toContain('<cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>ABC Pty Ltd</');
            expect(res.text).toContain('<cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>ABC Corp</');
            expect(res.text).toContain('<cac:LegalMonetaryTotal><cbc:PayableAmount currencyID=\"USD\"');
            expect(res.text).toContain('<cac:InvoiceLine><cbc:ID>1</');
            expect(res.text).toContain('<cbc:InvoicedQuantity unitCode=\"PCS\">1</');
            expect(res.text).toContain('<cbc:LineExtensionAmount currencyID="USD">5</');
            expect(res.text).toContain('<cac:Item><cbc:Description>Electronic Component</cbc:Description><cbc:Name>Item</');
            expect(res.text).toContain('<cac:Price><cbc:PriceAmount currencyID="USD">5</');
            expect(res.text).toContain('<cac:InvoiceLine><cbc:ID>2</');
            expect(res.text).toContain('<cbc:InvoicedQuantity unitCode=\"PCS\">1</');
            expect(res.text).toContain('<cbc:LineExtensionAmount currencyID="USD">15</');
            expect(res.text).toContain('<cac:Price><cbc:PriceAmount currencyID=\"USD\">15</');
            expect(res.text).toContain('<cac:Item><cbc:Description>Battery Component</cbc:Description><cbc:Name>Item2</');
        });
  
        test('converting multiple different invoices to XML successfully', async () => {
            getUserBySessionId
                .mockImplementation((sessionId, callback) => {
                    callback(null, {
                        userId: 1,
                        email: "abc@gmail.com",
                        company: "ABC Pty Ltd"
                    });
                });
            getInvoiceByID
                .mockImplementationOnce((InvoiceID, callback) => {
                    callback(null, { ...mockInvoice, Items: mockItems });
                })
                .mockImplementationOnce((InvoiceID, callback) => {
                    callback(null, { ...mockInvoice2, Items: mockItems2 });
                });
            const res = await request(app)
                .get('/api/v2/invoice/123456/xml')
                .set('sessionid', '123');
            expect(typeof res.text).toBe('string');
            expect(res.status).toBe(200);
            expect(res.text).toContain('<?xml version="1.0" encoding="UTF-8"');
            expect(res.text).toContain('<Invoice');
            expect(res.text).toContain('<cbc:ID>123456</');
            expect(res.text).toContain('<cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>ABC Pty Ltd</');
            expect(res.text).toContain('<cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>ABC Corp</');
            expect(res.text).toContain('<cac:LegalMonetaryTotal><cbc:PayableAmount currencyID=\"USD\"/>');
            expect(res.text).toContain('<cac:InvoiceLine><cbc:ID>1</');
            expect(res.text).toContain('<cbc:InvoicedQuantity unitCode=\"PCS\">1</');
            expect(res.text).toContain('<cbc:LineExtensionAmount currencyID="USD">10</');
            expect(res.text).toContain('<cac:Item><cbc:Description>Electronic Component</cbc:Description><cbc:Name>Item</');
            expect(res.text).toContain('<cac:Price><cbc:PriceAmount currencyID="USD">10</');
           
            expect(res.text).toContain('<cbc:Name>Item</');
            const res2 = await request(app)
                .get('/api/v2/invoice/234567/xml')
                .set('sessionid', '123');
            expect(typeof res.text).toBe('string');
            expect(res2.status).toBe(200);
            expect(res2.text).toContain('<?xml version="1.0" encoding="UTF-8"');
            expect(res2.text).toContain('<Invoice');
            expect(res2.text).toContain('<cbc:ID>234567</');
            expect(res2.text).toContain('<cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>ABC Pty Ltd</');
            expect(res2.text).toContain('<cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>ABC Corp</');
            expect(res2.text).toContain('<cac:LegalMonetaryTotal><cbc:PayableAmount currencyID=\"USD\"/>');
            expect(res2.text).toContain('<cac:InvoiceLine><cbc:ID>1</');
            expect(res2.text).toContain('<cbc:InvoicedQuantity unitCode=\"PCS\">1</');
            expect(res2.text).toContain('<cbc:LineExtensionAmount currencyID="USD">5</');
            expect(res2.text).toContain('<cac:Item><cbc:Description>Electronic Component</cbc:Description><cbc:Name>Item</cbc:Name></');
            expect(res2.text).toContain('<cac:Price><cbc:PriceAmount currencyID=\"USD\">5</');
            expect(res2.text).toContain('<cac:InvoiceLine><cbc:ID>2</');
            expect(res2.text).toContain('<cbc:InvoicedQuantity unitCode=\"PCS\">1</');
            expect(res2.text).toContain('<cbc:LineExtensionAmount currencyID="USD">15</');
            expect(res2.text).toContain('<cac:Item><cbc:Description>Battery Component</cbc:Description><cbc:Name>Item2</cbc:Name></');
            expect(res2.text).toContain('<cac:Price><cbc:PriceAmount currencyID="USD">15</');
        });
    });

    describe('Testing error return values', () => {
        test('invalid invoiceId - invoice not found error', async () => {
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                callback(null, {
                    userId: 1,
                    email: "abc@gmail.com",
                    company: "ABC Pty Ltd"
                });
            });
            getInvoiceByID.mockImplementationOnce((InvoiceID, callback) => {
                return callback(new CustomInputError('Invoice not found.'));
            });
            const res = await request(app)
                .get('/api/v2/invoice/123/xml')
                .set('sessionid', '1234');
            expect(res.body).toEqual({ error: "Invoice not found." });
            expect(res.status).toBe(404);
        });

        test('invalid sessionId - session not found error', async () => {
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                return callback(new CustomInputError('Session not found.'));
            });
            const res = await request(app)
                .get('/api/v2/invoice/123/xml')
                .set('sessionid', '1234');
            expect(res.body).toEqual({ error: "Session not found." });
            expect(res.status).toBe(401);
        });
    });
});
