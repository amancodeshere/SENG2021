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

describe('View invoice route - Comprehensive Tests', () => {
    const mockInvoice = {
        InvoiceID: 123456,
        IssueDate: "2025-03-06",
        PartyNameBuyer: "ABC Corp",
        PayableAmount: 500,
        CurrencyCode: "USD",
    };
    const mockItems = [
        {
            ItemName: "New Item",
            ItemDescription: "Electronic Component",
            ItemPrice: 10,
            ItemQuantity: 50,
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
                .get('/api/v2/invoice/123456')
                .set('sessionid', '123');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                invoiceId: 123456,
                issueDate: "2025-03-06",
                partyNameBuyer: "ABC Corp",
                payableAmount: "USD 500",
                items: [
                    {
                        name: "New Item",
                        description: "Electronic Component",
                        price: "USD 10",
                        quantity: "50 PCS"
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
            };
            const mockItems2 = [
                {
                    ItemName: "New Item",
                    ItemDescription: "Electronic Component",
                    ItemPrice: 10,
                    ItemQuantity: 10,
                    ItemUnitCode: "PCS",
                },
                {
                    ItemName: "Other Item",
                    ItemDescription: "Battery Component",
                    ItemPrice: 20,
                    ItemQuantity: 20,
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
                .get('/api/v2/invoice/234567')
                .set('sessionid', '123');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                invoiceId: 234567,
                issueDate: "2025-03-06",
                partyNameBuyer: "ABC Corp",
                payableAmount: "USD 500",
                items: [
                    {
                        name: "New Item",
                        description: "Electronic Component",
                        price: "USD 10",
                        quantity: "10 PCS"
                    },
                    {
                        name: "Other Item",
                        description: "Battery Component",
                        price: "USD 20",
                        quantity: "20 PCS"
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
                .get('/api/v2/invoice/123')
                .set('sessionid', '1234');
            expect(res.body).toEqual({ error: "Invoice not found." });
            expect(res.status).toBe(404);
        });

        test('invalid sessionId - session not found error', async () => {
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                return callback(new CustomInputError("Session not found."));
            });
            const res = await request(app)
                .get('/api/v2/invoice/123')
                .set('sessionid', '1234');
            expect(res.body).toEqual({ error: "Session not found." });
            expect(res.status).toBe(401);
        });
    });
});
