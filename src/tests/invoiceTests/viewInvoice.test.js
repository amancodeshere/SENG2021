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

    describe('Testing successful viewInvoice', () => {
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
                .get('/api/v1/invoice/123456')
                .set('sessionid', '123')
            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                invoiceId: 123456,
                salesOrderID: 12345678,
                issueDate: "2025-03-06",
                partyNameBuyer: "ABC Corp",
                payableAmount: "USD 500",
                items: [
                    {
                        description: "Electronic Component",
                        amount: "10 PCS"
                    }
                ]
            });
        });

        test('Viewing an invoice with multiple items successfully', async () => {
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
                {
                    ItemDescription: "Battery Component",
                    BuyersItemIdentification: "324455",
                    SellersItemIdentification: "876867",
                    ItemAmount: 15,
                    ItemUnitCode: "PCS",
                }
            ];

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
                .get('/api/v1/invoice/234567')
                .set('sessionid', '123')
                expect(res.status).toBe(200);
                expect(res.body).toEqual({
                    invoiceId: 234567,
                    salesOrderID: 2454565,
                    issueDate: "2025-03-06",
                    partyNameBuyer: "ABC Corp",
                    payableAmount: "USD 500",
                    items: [
                        {
                            description: "Electronic Component",
                            amount: "5 PCS"
                        },
                        {
                            description: "Battery Component",
                            amount: "15 PCS"
                        }
                    ]
                });
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
                .set('sessionid', '1234')
            expect(res.body).toEqual({ error: "Invoice not found." });
            expect(res.status).toBe(404);
        });

        test('invalid sessionId - session not found error', async () => {
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                return callback(new CustomInputError("Session not found."));
            });
            const res = await request(app)
                .get('/api/v1/invoice/123/xml')
                .set('sessionid', '1234')
            expect(res.body).toEqual({ error: "Session not found." });
            expect(res.status).toBe(401);
        });
    });
});
