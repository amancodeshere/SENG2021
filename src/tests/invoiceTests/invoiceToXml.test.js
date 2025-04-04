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
        InvoiceID: 123456,
        IssueDate: "2025-03-06",
        PartyNameBuyer: "ABC Corp",
        PayableAmount: 10,
        CurrencyCode: "USD",
    };
    const mockItems = [
        {
            ItemName: "Item",
            ItemDescription: "Electronic Component",
            ItemAmount: 10,
            ItemUnitCode: "PCS",
        },
    ];

    describe('Testing successful invoiceToXml', () => {
        const mockInvoice2 = {
            InvoiceID: 234567,
            IssueDate: "2025-03-06",
            PartyNameBuyer: "ABC Corp",
            PayableAmount: 20,
            CurrencyCode: "USD",
        };
        const mockItems2 = [
            {
                ItemName: "Item",
                ItemDescription: "Electronic Component",
                ItemAmount: 5,
                ItemUnitCode: "PCS",
            },
            {
                ItemName: "Item2",
                ItemDescription: "Battery Component",
                ItemAmount: 15,
                ItemUnitCode: "PCS",
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
                .get('/api/v1/invoice/123456/xml')
                .set('sessionid', '123');
            expect(typeof res.text).toBe("string");
            expect(res.status).toBe(200);
            expect(res.text).toContain('<?xml version="1.0" encoding="UTF-8"');
            expect(res.text).toContain("<Invoice");
            expect(res.text).toContain("<cbc:ID>123456</");
            expect(res.text).toContain("<cbc:IssueDate>2025-03-06</");
            expect(res.text).toContain("<cbc:DocumentCurrencyCode>USD</");
            expect(res.text).toContain("<cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>ABC Pty Ltd</");
            expect(res.text).toContain("<cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>ABC Corp</");
            expect(res.text).toContain("<cbc:PayableAmount>10</");
            expect(res.text).toContain("<cac:InvoiceLine><cbc:ID>1</");
            expect(res.text).toContain("<cac:Price><cbc:PriceAmount>10</");
            expect(res.text).toContain("<cbc:LineExtensionAmount>10</");
            expect(res.text).toContain("<cbc:Name>Item</");
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
                .get('/api/v1/invoice/234567/xml')
                .set('sessionid', '123');
            expect(typeof res.text).toBe("string");
            expect(res.status).toBe(200);
            expect(res.text).toContain('<?xml version="1.0" encoding="UTF-8"');
            expect(res.text).toContain("<Invoice");
            expect(res.text).toContain("<cbc:ID>234567</");
            expect(res.text).toContain("<cbc:IssueDate>2025-03-06</");
            expect(res.text).toContain("<cbc:DocumentCurrencyCode>USD</");
            expect(res.text).toContain("<cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>ABC Pty Ltd</");
            expect(res.text).toContain("<cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>ABC Corp</");
            expect(res.text).toContain("<cbc:PayableAmount>20</");
            expect(res.text).toContain("<cac:InvoiceLine><cbc:ID>1</");
            expect(res.text).toContain("<cac:Price><cbc:PriceAmount>5</");
            expect(res.text).toContain("<cbc:LineExtensionAmount>5</");
            expect(res.text).toContain("<cbc:Name>Item</");
            expect(res.text).toContain("<cac:InvoiceLine><cbc:ID>2</");
            expect(res.text).toContain("<cac:Price><cbc:PriceAmount>15</");
            expect(res.text).toContain("<cbc:LineExtensionAmount>15</");
            expect(res.text).toContain("<cbc:Name>Item2</");
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
                .get('/api/v1/invoice/123456/xml')
                .set('sessionid', '123');
            expect(typeof res.text).toBe("string");
            expect(res.status).toBe(200);
            expect(res.text).toContain('<?xml version="1.0" encoding="UTF-8"');
            expect(res.text).toContain("<Invoice");
            expect(res.text).toContain("<cbc:ID>123456</");
            expect(res.text).toContain("<cbc:IssueDate>2025-03-06</");
            expect(res.text).toContain("<cbc:DocumentCurrencyCode>USD</");
            expect(res.text).toContain("<cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>ABC Pty Ltd</");
            expect(res.text).toContain("<cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>ABC Corp</");
            expect(res.text).toContain("<cbc:PayableAmount>10</");
            expect(res.text).toContain("<cac:InvoiceLine><cbc:ID>1</");
            expect(res.text).toContain("<cac:Price><cbc:PriceAmount>10</");
            expect(res.text).toContain("<cbc:LineExtensionAmount>10</");
            expect(res.text).toContain("<cbc:Name>Item</");
            const res2 = await request(app)
                .get('/api/v1/invoice/234567/xml')
                .set('sessionid', '123');
            expect(typeof res.text).toBe("string");
            expect(res2.status).toBe(200);
            expect(res2.text).toContain('<?xml version="1.0" encoding="UTF-8"');
            expect(res2.text).toContain("<Invoice");
            expect(res2.text).toContain("<cbc:ID>234567</");
            expect(res2.text).toContain("<cbc:IssueDate>2025-03-06</");
            expect(res2.text).toContain("<cbc:DocumentCurrencyCode>USD</");
            expect(res2.text).toContain("<cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>ABC Pty Ltd</");
            expect(res2.text).toContain("<cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>ABC Corp</");
            expect(res2.text).toContain("<cbc:PayableAmount>20</");
            expect(res2.text).toContain("<cac:InvoiceLine><cbc:ID>1</");
            expect(res2.text).toContain("<cac:Price><cbc:PriceAmount>5</");
            expect(res2.text).toContain("<cbc:LineExtensionAmount>5</");
            expect(res2.text).toContain("<cbc:Name>Item</");
            expect(res2.text).toContain("<cac:InvoiceLine><cbc:ID>2</");
            expect(res2.text).toContain("<cac:Price><cbc:PriceAmount>15</");
            expect(res2.text).toContain("<cbc:LineExtensionAmount>15</");
            expect(res2.text).toContain("<cbc:Name>Item2</");
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
                return callback(new CustomInputError("Invoice not found."));
            });
            const res = await request(app)
                .get('/api/v1/invoice/123/xml')
                .set('sessionid', '1234');
            expect(res.body).toEqual({ error: "Invoice not found." });
            expect(res.status).toBe(404);
        });

        test('invalid sessionId - session not found error', async () => {
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                return callback(new CustomInputError("Session not found."));
            });
            const res = await request(app)
                .get('/api/v1/invoice/123/xml')
                .set('sessionid', '1234');
            expect(res.body).toEqual({ error: "Session not found." });
            expect(res.status).toBe(401);
        });
    });
});
