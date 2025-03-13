import request from 'supertest';
import { app } from '../../app.js';
import fs from 'fs';

// constants for request parameters
const VALID_EMAIL = 'valid@gmail.com';
const VALID_COMPANY_NAME = 'Valid Pty Ltd';
const VALID_PASSWORD = 'Password123';
const SECOND_EMAIL = 'candle.craft@gmail.com'
const SECOND_COMPANY_NAME = 'Candlecraft Pty Ltd';
const INVALID_EMAIL = 'invalid email';
const INVALID_COMPANY_NAME = 'Candlecr@ft Pty Ltd!';
const SHORT_COMPANY_NAME = '';
const SHORT_PASSWORD = 'pgh32';
const PASSWORD_NO_NUMBERS = 'asdfghJGF';
const PASSWORD_NO_LETTERS = '12345678';

const dbPath = '../../../database.db';
beforeEach(async () => {
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }
});
  
describe('adminRegister route - Comprehensive Tests', () => {
    const user = {
        companyName: VALID_COMPANY_NAME,
        email: VALID_EMAIL,
        password: VALID_PASSWORD
    };

    describe('Testing successful adminRegister', () => {
        test('Correct return value', async () => {
            const res = await request(app)
                .post('/v1/api/admin/register')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res.body).toEqual({ sessionId: expect.any(Number) });
            expect(res.status).toBe(200);
        });
  
        test('create multiple users with unique sessionIds', async () => {
            const res1 = await request(app)
                .post('/v1/api/admin/register')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res1.body).toEqual({ sessionId: expect.any(Number) });
            expect(res1.status).toBe(200);

            const user2 = {
                companyName: SECOND_COMPANY_NAME,
                email: SECOND_EMAIL,
                password: VALID_PASSWORD
            };
            const res2 = await request(app)
                .post('/v1/api/admin/register')
                .set('Content-Type', 'application/json')
                .send(user2);
            expect(res2.body).toEqual({ sessionId: expect.any(Number) });
            expect(res2.status).toBe(200);
            expect(res1.body.sessionId).not.toEqual(res2.body.sessionId);
        });
    });

    describe('Testing error return values', () => {
        test('email address already in use', async () => {
            await request(app)
                .post('/v1/api/admin/register')
                .set('Content-Type', 'application/json')
                .send(user);
            const res = await request(app)
                .post('/v1/api/admin/register')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res.body).toEqual({ error: expect.any(String) });
            expect(res.statusCode).toBe(400);
        });
    
        test('email is not valid', async () => {
            user.email = INVALID_EMAIL;
            const res = await request(app)
                .post('/v1/api/admin/register')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res.body).toEqual({ error: expect.any(String) });
            expect(res.statusCode).toBe(400);
        });
  
        test('companyName contains invalid characters', async () => {
            user.companyName = INVALID_COMPANY_NAME;
            const res = await request(app)
                .post('/v1/api/admin/register')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res.body).toEqual({ error: expect.any(String) });
            expect(res.statusCode).toBe(400);
        });
  
        test('companyName is less than 2 characters', async () => {
            user.companyName = SHORT_COMPANY_NAME;
            const res = await request(app)
                .post('/v1/api/admin/register')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res.body).toEqual({ error: expect.any(String) });
            expect(res.statusCode).toBe(400);
        });
  
        test('password is less than 8 characters', async () => {
            user.password = SHORT_PASSWORD;
            const res = await request(app)
                .post('/v1/api/admin/register')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res.body).toEqual({ error: expect.any(String) });
            expect(res.statusCode).toBe(400);
        });
  
        test('password does not contain at least one number and at least one letter', async () => {
            user.password = PASSWORD_NO_NUMBERS;
            let res = await request(app)
                .post('/v1/api/admin/register')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res.body).toEqual({ error: expect.any(String) });
            expect(res.statusCode).toBe(400);

            user.password = PASSWORD_NO_LETTERS;
            res = await request(app)
                .post('/v1/api/admin/register')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res.body).toEqual({ error: expect.any(String) });
            expect(res.statusCode).toBe(400);
        });
    });
});
