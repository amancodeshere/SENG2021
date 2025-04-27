import request from 'supertest';
import { app } from '../../app.js';
import { getInvoicesByCompanyName } from '../../invoiceToDB.js';
import { listInvoices } from '../../invoice.js';
import { getUserBySessionId } from '../../UsersToDB.js';
import { CustomInputError } from '../../errors.js';

jest.mock('../../UsersToDB.js', () => ({
    getUserBySessionId: jest.fn()
}));

jest.mock('../../invoice.js', () => ({
    listInvoices: jest.fn()
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('listInvoices route - Comprehensive Tests', () => {
    const mockInvoicesList = [
        {
            invoiceId: 123456,
            issueDate: '2025-03-06',
            partyNameBuyer: 'Buyer Pty',
            payableAmount: 'USD 500'
        }
    ];

    describe('Testing successful listInvoices', () => {
        test('Correct return value', async () => {
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                callback(null, {
                    userId: 1,
                    email: "abc@gmail.com",
                    company: 'Seller Co'
                });
            });
            listInvoices.mockImplementationOnce((partyNameBuyer, callback) => {
                callback(null, mockInvoicesList);
            });

            const res = await request(app)
                .get('/api/v2/invoices/list')
                .set('sessionid', '123')
                .query({ partyNameBuyer: 'ABC Corp' });
            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockInvoicesList);
        });

        test('Viewing an empty list successfully when no invoices for partyNameBuyer found', async () => {

            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                callback(null, {
                    userId: 1,
                    email: "abc@gmail.com",
                    company: "ABC Pty Ltd"
                });
            });
            listInvoices.mockImplementationOnce((partyNameBuyer, callback) => {
                callback(null, []);
            });

            const res = await request(app)
                .get('/api/v2/invoices/list')
                .set('sessionid', '123')
                .query({ partyNameBuyer: 'ABC Corp' });
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        test('Viewing a list of multiple invoices successfully', async () => {
            const mockInvoicesList2 = [
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
            ];

            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                callback(null, {
                    userId: 1,
                    email: "abc@gmail.com",
                    company: "ABC Pty Ltd"
                });
            });
            listInvoices.mockImplementationOnce((partyNameBuyer, callback) => {
                callback(null, mockInvoicesList2);
            });

            const res = await request(app)
                .get('/api/v2/invoices/list')
                .set('sessionid', '123')
                .query({ partyNameBuyer: 'ABC Corp' });
            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockInvoicesList2);
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
            listInvoices.mockImplementationOnce((partyNameBuyer, callback) => {
                callback(new CustomInputError("partyNameBuyer contains invalid characters."));
            });
            const res = await request(app)
                .get('/api/v2/invoices/list')
                .set('sessionid', '123')
                .query({ partyNameBuyer: '@BC Corp' });
            expect(res.body).toEqual({ error: "partyNameBuyer contains invalid characters." });
            expect(res.status).toBe(400);
        });

        test('invalid sessionId - session not found error', async () => {
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                return callback(new CustomInputError("Session not found."));
            });
            const res = await request(app)
                .get('/api/v2/invoices/list')
                .set('sessionid', '123')
                .query({ partyNameBuyer: 'ABC Corp' });
            expect(res.body).toEqual({ error: "Session not found." });
            expect(res.status).toBe(401);
        });
    });
});
