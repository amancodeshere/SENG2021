import request from 'supertest';
import { app } from '../../app.js';
import { getUserBySessionId } from '../../UsersToDB.js';
import { getInvoiceByID } from '../../invoiceToDB.js';
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
        currencycode: 'USD'
    };

    const mockItems = [
        {
            invoiceitemname: 'Item 1',
            itemdescription: 'Electronic Component',
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

            getInvoiceByID.mockImplementationOnce((invoiceId, callback) => {
                callback(null, {
                    ...mockInvoice,
                    Items: mockItems
                });
            });


            const res = await request(app)
                .get('/api/v2/invoice/42')
                .set('sessionId', '999');


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
                currencycode: 'USD',
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


            getInvoiceByID.mockImplementationOnce((invoiceId, callback) => {
                callback(null, {
                    ...mockInvoice2,
                    Items: mockItems2
                });
            });


            const res = await request(app)
                .get('/api/v2/invoice/42')
                .set('sessionId', '999');


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


    describe('🚨 Error paths', () => {
        test('401 when session is invalid', async () => {
            getUserBySessionId.mockImplementation((sid, cb) => {
                cb(new CustomInputError('Session not found.'));
            });


            const res = await request(app)
                .get('/api/v2/invoice/42')
                .set('sessionId', '999');


            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: 'Session not found.' });
        });


        test('404 when invoice lookup fails', async () => {
            jest.clearAllMocks();

            getUserBySessionId.mockImplementation((sid, cb) => {
                cb(null, { userId: 2, email: 'y@y.com', company: 'Beta LLC' });
            });

            getInvoiceByID.mockImplementationOnce((invoiceId, callback) => {
                callback(new CustomInputError('Invoice not found.'));
            });

            const res = await request(app)
                .get('/api/v2/invoice/1')
                .set('sessionId', '999');


            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Invoice not found.' });
        });
    });
});