import request from 'supertest';
import { app } from '../../app.js';
import * as sessionHelper from '../../UsersToDB.js';
import { db } from '../../connect.js';


jest.mock('../../UsersToDB.js');
jest.mock('../../connect.js', () => ({
    db: {
        query: jest.fn(),
    },
}));


describe('PUT /api/v1/invoice/:id - Invoice Update Endpoint', () => {
    const sessionId = 101;
    const invoiceId = 1;


    beforeEach(() => {
        jest.clearAllMocks();
    });


    it('should return 401 if session is invalid', async () => {
        sessionHelper.getUserBySessionId.mockImplementation((sid, cb) =>
            cb(new Error('Invalid session ID'))
        );


        const res = await request(app)
            .put(`/api/v1/invoice/${invoiceId}`)
            .set('sessionid', sessionId)
            .send({ toUpdate: 'PayableAmount', newData: 1000 });


        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'Invalid session ID');
    });


    it('should return 400 if sessionId is missing', async () => {
        const res = await request(app)
            .put(`/api/v1/invoice/${invoiceId}`)
            .send({ toUpdate: 'PayableAmount', newData: 1000 });


        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid or missing session ID.' });
    });


    it('should return 400 if sessionId is not a number', async () => {
        const res = await request(app)
            .put(`/api/v1/invoice/${invoiceId}`)
            .set('sessionid', 'abc')
            .send({ toUpdate: 'PayableAmount', newData: 1000 });


        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid or missing session ID.' });
    });


    it('should return 400 if toUpdate is an invalid field', async () => {
        sessionHelper.getUserBySessionId.mockImplementation((sid, cb) =>
            cb(null, { userId: 1, company: 'ABC Corp' })
        );


        const res = await request(app)
            .put(`/api/v1/invoice/${invoiceId}`)
            .set('sessionid', sessionId)
            .send({ toUpdate: 'invalidField', newData: 'someValue' });


        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid field for update.');
    });


    it('should return 400 if newData is not provided', async () => {
        sessionHelper.getUserBySessionId.mockImplementation((sid, cb) =>
            cb(null, { userId: 1, company: 'ABC Corp' })
        );


        const res = await request(app)
            .put(`/api/v1/invoice/${invoiceId}`)
            .set('sessionid', sessionId)
            .send({ toUpdate: 'PayableAmount' });


        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'New data value required.');
    });


    it('should update invoice successfully with valid input', async () => {
        sessionHelper.getUserBySessionId.mockImplementation((sid, cb) =>
            cb(null, { userId: 1, company: 'ABC Corp' })
        );


        db.query.mockResolvedValueOnce({ rowCount: 1 });


        const res = await request(app)
            .put(`/api/v1/invoice/${invoiceId}`)
            .set('sessionid', sessionId)
            .send({ toUpdate: 'PayableAmount', newData: 2500 });


        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Invoice updated successfully.' });
    });


    it('should return 400 if update affects no rows', async () => {
        sessionHelper.getUserBySessionId.mockImplementation((sid, cb) =>
            cb(null, { userId: 1, company: 'ABC Corp' })
        );


        db.query.mockResolvedValueOnce({ rowCount: 0 });


        const res = await request(app)
            .put(`/api/v1/invoice/${invoiceId}`)
            .set('sessionid', sessionId)
            .send({ toUpdate: 'PayableAmount', newData: 2500 });


        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invoice not found or update failed.');
    });


    it('should return 400 if db throws an error', async () => {
        sessionHelper.getUserBySessionId.mockImplementation((sid, cb) =>
            cb(null, { userId: 1, company: 'ABC Corp' })
        );


        db.query.mockRejectedValueOnce(new Error('Simulated DB error'));


        const res = await request(app)
            .put(`/api/v1/invoice/${invoiceId}`)
            .set('sessionid', sessionId)
            .send({ toUpdate: 'PayableAmount', newData: 2500 });


        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Database error during invoice update.');
    });


    afterAll(() => {
        jest.resetAllMocks();
    });
});





