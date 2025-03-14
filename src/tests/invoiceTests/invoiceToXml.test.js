import request from 'supertest';
import { app } from '../../app.js';
import { getInvoiceByID } from '../../invoiceToDB.js';
import { getUserBySessionId } from '../../UsersToDB.js';
import { CustomInputError } from '../../errors.js';

// constants for request parameters

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
        PayableAmount: 500,
        CurrencyCode: "USD",
        SalesOrderID: "12345678",
    };
    const mockItems = [
        {
            ItemDescription: "Electronic Component",
            BuyersItemIdentification: "87654321",
            SellersItemIdentification: "12345678",
            ItemAmount: 10,
            ItemUnitCode: "PCS",
        },
    ];

    describe('Testing successful invoiceToXml', () => {
        const mockInvoice2 = {
            InvoiceID: 234567,
            IssueDate: "2025-03-06",
            PartyNameBuyer: "ABC Corp",
            PayableAmount: 500,
            CurrencyCode: "USD",
            SalesOrderID: "2454565",
        };
        const mockItems2 = [
            {
                ItemDescription: "Electronic Component",
                BuyersItemIdentification: "343543",
                SellersItemIdentification: "4334555",
                ItemAmount: 5,
                ItemUnitCode: "PCS",
            },
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
                .get('/v1/api/invoice/123456/xml')
                .set('sessionid', '123')
            // expect(res.body).toEqual();
            console.log(res.text);
            expect(res.status).toBe(200);
        });
  
        test.skip('converting multiple different invoices to Xml successfully in the same session', async () => {
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
                .get('/v1/api/invoice/123456/xml')
                .set('sessionid', '123');
            // expect(res.body).toEqual();
            expect(res.status).toBe(200);
            const res2 = await request(app)
                .get('/v1/api/invoice/234567/xml')
                .set('sessionid', '123');
            // expect(res2.body).toEqual();
            expect(res2.status).toBe(200);
        });

        test.skip('converting multiple different invoices to Xml successfully in different sessions', async () => {
            getUserBySessionId
                .mockImplementationOnce((sessionId, callback) => {
                    callback(null, {
                        userId: 1,
                        email: "abc@gmail.com",
                        company: "ABC Pty Ltd"
                    });
                })
                .mockImplementationOnce((sessionId, callback) => {
                    callback(null, {
                        userId: 2,
                        email: "def@gmail.com",
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
                .get('/v1/api/invoice/123456/xml')
                .set('sessionid', '123');
            expect(res.body).toEqual();
            expect(res.status).toBe(200);
            const res2 = await request(app)
                .get('/v1/api/invoice/234567/xml')
                .set('sessionid', '456');
            expect(res2.body).toEqual();
            expect(res2.status).toBe(200);
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
                .get('/v1/api/invoice/123/xml')
                .set('sessionid', '123')
            expect(res.body).toEqual({ error: "Invoice not found." });
            expect(res.status).toBe(404);
        });

        test('invalid sessionId - session not found error', async () => {
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                return callback(new CustomInputError("Session not found."));
            });
            const res = await request(app)
                .get('/v1/api/invoice/123456/xml')
                .set('sessionid', '1234')
            expect(res.body).toEqual({ error: "Session not found." });
            expect(res.status).toBe(401);
        });
    });
});
