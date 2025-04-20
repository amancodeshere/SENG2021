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
        invoiceid: 123456,
        issuedate: '2025-03-06',
        partynamebuyer: 'Buyer Pty',
        partynameseller: 'Seller Co',
        currencycode: 'USD',
        salesorderid: 123456
    };

    const mockItems = [
        {
            invoiceitemname: 'Item 1',
            itemdescription: 'Electronic Component',
            buyersitemidentification: 1,
            sellersitemidentification: 2,
            itemprice: 10,
            itemquantity: 50,
            itemunitcode: 'EA'
        },
    ];

    describe('Testing successful viewInvoice', () => {
        test('Correct return value', async () => {
            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                callback(null, {
                    userId: 1,
                    email: 'abc@gmail.com',
                    company: 'Seller Co'
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
                issueDate: '2025-03-06',
                partyNameBuyer: 'Buyer Pty',
                payableAmount: 'USD 500',
                items: [
                    {
                        name: 'Item 1',
                        description: 'Electronic Component',
                        price: 'USD 10',
                        quantity: '50 EA'
                    }
                ]
            });
        });

        test('Viewing an invoice with multiple items successfully', async () => {
            const mockInvoice2 = {
                invoiceid: 234567,
                issuedate: "2025-03-06",
                partynamebuyer: 'Buyer Pty',
                partynameseller: 'Seller Co',
                currencycode: 'USD',
                salesorderid: 234567 
            };
            const mockItems2 = [
                {
                    invoiceitemname: 'New Item',
                    itemdescription: 'Electronic Component',
                    buyersitemidentification: 1,
                    sellersitemidentification: 2,
                    itemprice: 10,
                    itemquantity: 10,
                    itemunitcode: 'PCS',
                },
                {
                    invoiceitemname: 'Other Item',
                    itemdescription: "Battery Component",
                    buyersitemidentification: 1,
                    sellersitemidentification: 2,
                    itemprice: 20,
                    itemquantity: 20,
                    itemunitcode: 'PCS',
                }
            ];

            getUserBySessionId.mockImplementationOnce((sessionId, callback) => {
                callback(null, {
                    userId: 1,
                    email: 'abc@gmail.com',
                    company: 'Seller Co'
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
                issueDate: '2025-03-06',
                partyNameBuyer: 'Buyer Pty',
                payableAmount: 'USD 500',
                items: [
                    {
                        name: 'New Item',
                        description: 'Electronic Component',
                        price: 'USD 10',
                        quantity: '10 PCS'
                    },
                    {
                        name: 'Other Item',
                        description: 'Battery Component',
                        price: 'USD 20',
                        quantity: '20 PCS'
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
