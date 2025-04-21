jest.mock('../../UsersToDB.js', () => ({
    getUserBySessionId: jest.fn()
}));
jest.mock('../../invoiceToDB.js', () => ({
    getInvoiceByID: jest.fn()
}));


import request from 'supertest';
import { app } from '../../app.js';
import { getUserBySessionId } from '../../UsersToDB.js';
import { getInvoiceByID } from '../../invoiceToDB.js';
import { CustomInputError } from '../../errors.js';


beforeEach(() => {
    jest.clearAllMocks();
});


describe('GET /api/v2/invoice/:invoiceid', () => {
    const sessionHeader = 'sessionid';


    describe('✅ Successful fetch', () => {
        const baseInvoice = {
            InvoiceID: 42,
            IssueDate: '2025-03-06',
            PartyNameBuyer: 'Acme Corp',
            PayableAmount: 123.45,
            CurrencyCode: 'USD'
        };


        it('returns one item correctly', async () => {
            getUserBySessionId.mockImplementation((sid, cb) => {
                cb(null, { userId: 1, email: 'x@x.com', company: 'Acme Corp' });
            });
            getInvoiceByID.mockImplementation((id, cb) => {
                cb(null, {
                    ...baseInvoice,
                    Items: [{
                        ItemName:        'Widget',
                        ItemDescription: 'Useful',
                        ItemPrice:       10,
                        ItemQuantity:    3,
                        ItemUnitCode:    'PCS'
                    }]
                });
            });


            const res = await request(app)
                .get('/api/v2/invoice/42')
                .set(sessionHeader, '999');


            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                invoiceId:       42,
                issueDate:       '2025-03-06',
                partyNameBuyer:  'Acme Corp',
                payableAmount:   'USD 123.45',
                items: [{
                    name:        'Widget',
                    description: 'Useful',
                    price:       'USD 10',
                    quantity:    '3 PCS'
                }]
            });
        });


        it('returns multiple items correctly', async () => {
            getUserBySessionId.mockImplementation((sid, cb) => {
                cb(null, { userId: 1, email: 'x@x.com', company: 'Acme Corp' });
            });
            getInvoiceByID.mockImplementation((id, cb) => {
                cb(null, {
                    ...baseInvoice,
                    Items: [
                        { ItemName:'A', ItemDescription:'Desc A', ItemPrice:5,  ItemQuantity:1, ItemUnitCode:'EA' },
                        { ItemName:'B', ItemDescription:'Desc B', ItemPrice:7.5,ItemQuantity:2, ItemUnitCode:'EA' }
                    ]
                });
            });


            const res = await request(app)
                .get('/api/v2/invoice/99')
                .set(sessionHeader, '1000');


            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                invoiceId:      42,
                issueDate:      '2025-03-06',
                partyNameBuyer: 'Acme Corp',
                payableAmount:  'USD 123.45',
                items: [
                    { name:'A', description:'Desc A', price:'USD 5',  quantity:'1 EA' },
                    { name:'B', description:'Desc B', price:'USD 7.5',quantity:'2 EA' }
                ]
            });
        });
    });


    describe('🚨 Error paths', () => {
        it('401 when session is invalid', async () => {
            getUserBySessionId.mockImplementation((sid, cb) => {
                cb(new CustomInputError('Session not found.'));
            });


            const res = await request(app)
                .get('/api/v2/invoice/1')
                .set(sessionHeader, '1234');


            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: 'Session not found.' });
        });


        it('404 when invoice lookup fails', async () => {
            getUserBySessionId.mockImplementation((sid, cb) => {
                cb(null, { userId: 2, email: 'y@y.com', company: 'Beta LLC' });
            });
            getInvoiceByID.mockImplementation((id, cb) => {
                cb(new CustomInputError('Invoice not found.'));
            });


            const res = await request(app)
                .get('/api/v2/invoice/7')
                .set(sessionHeader, '555');


            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Invoice not found.' });
        });
    });
});