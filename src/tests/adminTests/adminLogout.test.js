import request from 'supertest';
import { app } from '../../app.js';
import * as admin from '../../admin.js';


jest.mock('../../admin.js', () => ({
    logout: jest.fn()
}));


describe('POST /api/v1/admin/logout', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });


    it('should logout successfully with valid sessionId header', async () => {
        admin.logout.mockImplementation((sessionId, callback) => {
            callback(null, { message: 'Logged out successfully.' });
        });


        const response = await request(app)
            .post('/api/v1/admin/logout')
            .set('sessionid', '123');


        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Logged out successfully.' });
        expect(admin.logout).toHaveBeenCalledWith(123, expect.any(Function));
    });


    it('should return 400 if sessionId is missing', async () => {
        const response = await request(app)
            .post('/api/v1/admin/logout');


        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid or missing session ID.' });
    });


    it('should return 400 if sessionId is not a number', async () => {
        const response = await request(app)
            .post('/api/v1/admin/logout')
            .set('sessionid', 'abc');


        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid or missing session ID.' });
    });


    it('should return error if logout fails internally', async () => {
        admin.logout.mockImplementation((sessionId, callback) => {
            callback(new Error('Logout failure'));
        });


        const response = await request(app)
            .post('/api/v1/admin/logout')
            .set('sessionid', '123');


        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Logout failure' });
    });
});
