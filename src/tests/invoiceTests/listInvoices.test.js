import request from 'supertest';
import { app } from '../../app.js';
import { getInvoicesByCompanyName } from '../../invoiceToDB.js';
import { getUserBySessionId } from '../../UsersToDB.js';
import { CustomInputError } from '../../errors.js';

jest.mock('../../UsersToDB.js', () => ({
    getUserBySessionId: jest.fn()
}));

jest.mock('../../invoiceToDB.js', () => ({
    getInvoicesByCompanyName: jest.fn()
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('invoiceToXml route - Comprehensive Tests', () => {
    const mockInvoicesList = [
        {
            InvoiceID: 123456,
            IssueDate: "2025-03-06",
            PartyNameBuyer: "ABC Corp",
            PayableAmount: 500,
            CurrencyCode: "USD",
        }
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
            getInvoicesByCompanyName.mockImplementationOnce((PartyNameBuyer, callback) => {
                callback(null, mockInvoicesList);
            });

            const res = await request(app)
                .get('/api/v1/invoices/list')
                .set('sessionid', '123')
                .query({ partyNameBuyer: 'ABC Corp' });
            expect(res.status).toBe(200);
            expect(res.body).toEqual([
                {
                    invoiceId: 123456,
                    issueDate: "2025-03-06",
                    partyNameBuyer: "ABC Corp",
                    payableAmount: "USD 500"
                }
            ]);
        });

        test('Viewing an empty list successfully when no invoices for partyNameBuyer found', async () => {

            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                callback(null, {
                    userId: 1,
                    email: "abc@gmail.com",
                    company: "ABC Pty Ltd"
                });
            });
            getInvoicesByCompanyName.mockImplementationOnce((PartyNameBuyer, callback) => {
                callback(new CustomInputError("No invoices found for this company."));
            });

            const res = await request(app)
                .get('/api/v1/invoices/list')
                .set('sessionid', '123')
                .query({ partyNameBuyer: 'ABC Corp' });
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        test('Viewing a list of multiple invoices successfully', async () => {
            const mockInvoice2 = [
                {
                    InvoiceID: 234567,
                    IssueDate: "2025-03-06",
                    PartyNameBuyer: "ABC Corp",
                    PayableAmount: 500,
                    CurrencyCode: "USD",
                },
                {
                    InvoiceID: 87865,
                    IssueDate: "2025-01-14",
                    PartyNameBuyer: "ABC Corp",
                    PayableAmount: 1000,
                    CurrencyCode: "USD",
                },
                {
                    InvoiceID: 87866,
                    IssueDate: "2025-01-14",
                    PartyNameBuyer: "ABC Pty Ltd",
                    PayableAmount: 1000,
                    CurrencyCode: "USD",
                }

            ];
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                callback(null, {
                    userId: 1,
                    email: "abc@gmail.com",
                    company: "ABC Pty Ltd"
                });
            });
            getInvoicesByCompanyName.mockImplementationOnce((PartyNameBuyer, callback) => {
                callback(null, mockInvoice2);
            });

            const res = await request(app)
                .get('/api/v1/invoices/list')
                .set('sessionid', '123')
                .query({ partyNameBuyer: 'ABC Corp' });
            expect(res.status).toBe(200);
            expect(res.body).toEqual([
                {
                    invoiceId: 234567,
                    issueDate: "2025-03-06",
                    partyNameBuyer: "ABC Corp",
                    payableAmount: "USD 500"
                },
                {
                    invoiceId: 87865,
                    issueDate: "2025-01-14",
                    partyNameBuyer: "ABC Corp",
                    payableAmount: "USD 1000"
                }
            ]);
        });
    });

    describe('Testing error return values', () => {
        test('invalid partyNameBuyer', async () => {
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                callback(null, {
                    userId: 1,
                    email: "abc@gmail.com",
                    company: "ABC Pty Ltd"
                });
            });
            const res = await request(app)
                .get('/api/v1/invoices/list')
                .set('sessionid', '123')
                .query({ partyNameBuyer: '@BC Corp' });
            expect(res.body).toEqual({ error: expect.any(String) });
            expect(res.status).toBe(400);
        });

        test('invalid sessionId - session not found error', async () => {
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                return callback(new CustomInputError("Session not found."));
            });
            const res = await request(app)
                .get('/api/v1/invoices/list')
                .set('sessionid', '123')
                .query({ partyNameBuyer: 'ABC Corp' });
            expect(res.body).toEqual({ error: "Session not found." });
            expect(res.status).toBe(401);
        });
    });
});
