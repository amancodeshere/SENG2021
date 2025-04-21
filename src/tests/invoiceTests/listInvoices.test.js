// __tests__/listInvoices.test.js


import request from 'supertest';
import { app } from '../../app.js';
import { db } from '../../connect.js';


jest.mock('../../connect.js', () => ({
    db: { query: jest.fn() }
}));


// no need to mock helperFunctions or invoice.js here
// since we're hitting the route, and _listInvoices is called as a callback


describe('GET /api/v2/invoices/list', () => {
    const goodSessionId = 42;
    const buyerName     = 'Acme Corp';
    const invoiceRow    = {
        invoiceid:           123,
        issuedate:           '2025-03-06',
        partynamebuyer:      buyerName,
        payableamount:       500,
        payablecurrencycode: 'USD'
    };


    beforeEach(() => {
        jest.clearAllMocks();
    });


    it('200 → returns formatted list when invoices exist', async () => {
        // 1st DB call → session→user
        db.query
            .mockResolvedValueOnce({ rows: [{ companyname: 'SellerCo' }] })
            // 2nd DB call → fetch invoices
            .mockResolvedValueOnce({ rows: [ invoiceRow ] });


        const res = await request(app)
            .get('/api/v2/invoices/list')
            .set('sessionid', String(goodSessionId))
            .query({ partyNameBuyer: buyerName });


        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            {
                invoiceId:      123,
                issueDate:      '2025-03-06',
                partyNameBuyer: buyerName,
                payableAmount:  'USD 500'
            }
        ]);
        expect(db.query).toHaveBeenCalledTimes(2);
    });


    it('200 → trims whitespace around partyNameBuyer', async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ companyname: 'SellerCo' }] })
            .mockResolvedValueOnce({ rows: [ invoiceRow ] });


        const res = await request(app)
            .get('/api/v2/invoices/list')
            .set('sessionid', String(goodSessionId))
            .query({ partyNameBuyer: `   ${buyerName}   ` });


        expect(res.status).toBe(200);
        expect(res.body[0].partyNameBuyer).toBe(buyerName);
    });


    it('200 → strips surrounding quotes', async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ companyname: 'SellerCo' }] })
            .mockResolvedValueOnce({ rows: [ invoiceRow ] });


        const res = await request(app)
            .get('/api/v2/invoices/list')
            .set('sessionid', String(goodSessionId))
            .query({ partyNameBuyer: `"${buyerName}"` });


        expect(res.status).toBe(200);
        expect(res.body[0].partyNameBuyer).toBe(buyerName);
    });


    it('200 → empty array if no invoices found', async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ companyname: 'SellerCo' }] })
            .mockResolvedValueOnce({ rows: [] });


        const res = await request(app)
            .get('/api/v2/invoices/list')
            .set('sessionid', String(goodSessionId))
            .query({ partyNameBuyer: buyerName });


        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });


    it('400 → invalid partyNameBuyer fails validation', async () => {
        // only session→user is called, invoice query never happens
        db.query.mockResolvedValueOnce({ rows: [{ companyname: 'SellerCo' }] });


        const res = await request(app)
            .get('/api/v2/invoices/list')
            .set('sessionid', String(goodSessionId))
            .query({ partyNameBuyer: '@Bad!!Name' });


        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            error: expect.stringContaining('invalid characters')
        });
        expect(db.query).toHaveBeenCalledTimes(1);
    });


    it('401 → missing session header', async () => {
        const res = await request(app)
            .get('/api/v2/invoices/list')
            .query({ partyNameBuyer: buyerName });


        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Invalid session ID' });
    });


    it('401 → session not in DB', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });


        const res = await request(app)
            .get('/api/v2/invoices/list')
            .set('sessionid', '999')
            .query({ partyNameBuyer: buyerName });


        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Invalid session ID' });
    });


    it('500 → DB error during session/user lookup', async () => {
        db.query.mockRejectedValueOnce(new Error('whoops'));


        const res = await request(app)
            .get('/api/v2/invoices/list')
            .set('sessionid', String(goodSessionId))
            .query({ partyNameBuyer: buyerName });


        expect(res.status).toBe(500);
        expect(res.body).toEqual({
            error: 'Internal session/user validation error'
        });
    });


    it('400 → DB error while listing invoices', async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ companyname: 'SellerCo' }] })
            .mockRejectedValueOnce(new Error('uh-oh'));


        const res = await request(app)
            .get('/api/v2/invoices/list')
            .set('sessionid', String(goodSessionId))
            .query({ partyNameBuyer: buyerName });


        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            error: 'Database error while listing invoices.'
        });
    });
});
