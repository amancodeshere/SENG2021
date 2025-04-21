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


describe('GET /api/v2/invoice/:invoiceid/xml', () => {
    const mockInvoice = {
        InvoiceID: 123456,
        IssueDate: "2025-03-06",
        PartyNameBuyer: "ABC Corp",
        PayableAmount: 10,
        CurrencyCode: "USD"
    };
    const mockItems = [{
        ItemName: "Item",
        ItemDescription: "Electronic Component",
        ItemPrice: 10,
        ItemQuantity: 1,
        ItemUnitCode: "PCS"
    }];


    it('returns valid UBL‑XML for a known invoice', async () => {
        getUserBySessionId.mockImplementationOnce((sid, cb) =>
            cb(null, { userId: 1, email: 'a@b.com', company: 'ABC Pty Ltd' })
        );
        getInvoiceByID.mockImplementationOnce((id, cb) =>
            cb(null, { ...mockInvoice, Items: mockItems })
        );


        const res = await request(app)
            .get('/api/v2/invoice/123456/xml')
            .set('sessionid', '123');


        expect(res.status).toBe(200);
        // It really starts with an XML prolog
        expect(res.text.startsWith('<?xml')).toBe(true);
        // It contains the invoice wrapper and the ID we passed
        expect(res.text).toContain('<Invoice');
        expect(res.text).toContain('<cbc:ID>123456</cbc:ID>');
        // And at least one invoice line
        expect(res.text).toContain('<cac:InvoiceLine>');
    });


    it('returns 401 when the session is invalid', async () => {
        getUserBySessionId.mockImplementationOnce((sid, cb) =>
            cb(new CustomInputError('Session not found.'))
        );


        const res = await request(app)
            .get('/api/v2/invoice/123456/xml')
            .set('sessionid', '999');


        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Session not found.' });
    });


    it('returns 404 when the invoice does not exist', async () => {
        getUserBySessionId.mockImplementationOnce((sid, cb) =>
            cb(null, { userId: 1, email: 'a@b.com', company: 'ABC Pty Ltd' })
        );
        getInvoiceByID.mockImplementationOnce((id, cb) =>
            cb(new CustomInputError('Invoice not found.'))
        );


        const res = await request(app)
            .get('/api/v2/invoice/000000/xml')
            .set('sessionid', '123');


        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Invoice not found.' });
    });
});