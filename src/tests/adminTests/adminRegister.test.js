import request from 'supertest';
import { app } from '../../app.js';
import { userInput } from '../../UsersToDB.js';
import { CustomInputError } from '../../errors.js';

// constants for request parameters
const VALID_EMAIL = 'valid@gmail.com';
const VALID_COMPANY_NAME = 'Valid Pty Ltd';
const VALID_PASSWORD = 'Password123';
const SECOND_EMAIL = 'candle.craft@gmail.com'
const SECOND_COMPANY_NAME = 'Candlecraft Pty Ltd';
const INVALID_EMAIL = 'invalid email';
const INVALID_COMPANY_NAME = 'Candlecr@ft Pty Ltd!';
const SHORT_COMPANY_NAME = 'a';
const SHORT_PASSWORD = 'pgh32';
const PASSWORD_NO_NUMBERS = 'asdfghJGF';
const PASSWORD_NO_LETTERS = '12345678';
const USERID1 = 1;
const USERID2 = 2;
const SESSIONID1 = 123;
const SESSIONID2 = 456;

jest.mock('../../UsersToDB.js', () => ({
    userInput: jest.fn()
}));

beforeEach(() => {
    jest.clearAllMocks();
});
  
describe('adminRegister route - Comprehensive Tests', () => {
    const user = {
        companyName: VALID_COMPANY_NAME,
        email: VALID_EMAIL,
        password: VALID_PASSWORD
    };

    describe('Testing successful adminRegister', () => {
        test('Correct return value', async () => {
            userInput.mockImplementationOnce((email, password, company, callback) => {
                callback(null, {
                    success: true,
                    message: "User registered.",
                    userID: USERID1,
                    sessionID: SESSIONID1
                });
            });
            const res = await request(app)
                .post('/api/v1/admin/register')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res.body).toEqual({ sessionId: SESSIONID1 });
            expect(res.status).toBe(200);
        });
  
        test('register multiple users successfully', async () => {
            userInput
                .mockImplementationOnce((email, password, company, callback) => {
                    callback(null, {
                        success: true,
                        message: "User registered.",
                        userID: USERID1,
                        sessionID: SESSIONID1
                    });
                })
                .mockImplementationOnce((email, password, company, callback) => {
                    callback(null, {
                        success: true,
                        message: "User registered.",
                        userID: USERID2,
                        sessionID: SESSIONID2
                    });
                });
            const res1 = await request(app)
                .post('/api/v1/admin/register')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res1.body).toEqual({ sessionId: SESSIONID1 });
            expect(res1.status).toBe(200);

            const user2 = {
                companyName: SECOND_COMPANY_NAME,
                email: SECOND_EMAIL,
                password: VALID_PASSWORD
            };
            const res2 = await request(app)
                .post('/api/v1/admin/register')
                .set('Content-Type', 'application/json')
                .send(user2);
            expect(res2.body).toEqual({ sessionId: SESSIONID2 });
            expect(res2.status).toBe(200);
        });
    });

    describe('Testing error return values', () => {
        test('email address already in use', async () => {
            userInput.mockImplementationOnce((email, password, company, callback) => {
                callback(new CustomInputError("Database error while inserting user."));
            });
            const res = await request(app)
                .post('/api/v1/admin/register')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res.body).toEqual({ error: "Database error while inserting user." });
            expect(res.statusCode).toBe(400);
        });
    
        test('email is not valid', async () => {
            const invalidUser = {
                companyName: VALID_COMPANY_NAME,
                email: INVALID_EMAIL,
                password: VALID_PASSWORD
            };
            const res = await request(app)
                .post('/api/v1/admin/register')
                .set('Content-Type', 'application/json')
                .send(invalidUser);
            expect(res.body).toEqual({ error: expect.any(String) });
            expect(res.statusCode).toBe(400);
        });
  
        test('companyName contains invalid characters', async () => {
            const invalidUser = {
                companyName: INVALID_COMPANY_NAME,
                email: VALID_EMAIL,
                password: VALID_PASSWORD
            };
            const res = await request(app)
                .post('/api/v1/admin/register')
                .set('Content-Type', 'application/json')
                .send(invalidUser);
            expect(res.body).toEqual({ error: expect.any(String) });
            expect(res.statusCode).toBe(400);
        });
  
        test('companyName is less than 3 characters', async () => {
            const invalidUser = {
                companyName: SHORT_COMPANY_NAME,
                email: VALID_EMAIL,
                password: VALID_PASSWORD
            };
            const res = await request(app)
                .post('/api/v1/admin/register')
                .set('Content-Type', 'application/json')
                .send(invalidUser);
            expect(res.body).toEqual({ error: expect.any(String) });
            console.log(res.body);
            expect(res.statusCode).toBe(400);
        });
  
        test('password is less than 8 characters', async () => {
            const invalidUser = {
                companyName: VALID_COMPANY_NAME,
                email: VALID_EMAIL,
                password: SHORT_PASSWORD
            };
            const res = await request(app)
                .post('/api/v1/admin/register')
                .set('Content-Type', 'application/json')
                .send(invalidUser);
            expect(res.body).toEqual({ error: expect.any(String) });
            expect(res.statusCode).toBe(400);
        });
  
        test('password does not contain at least one number and at least one letter', async () => {
            const invalidUser = {
                companyName: VALID_COMPANY_NAME,
                email: VALID_EMAIL,
                password: PASSWORD_NO_NUMBERS
            };
            let res = await request(app)
                .post('/api/v1/admin/register')
                .set('Content-Type', 'application/json')
                .send(invalidUser);
            expect(res.body).toEqual({ error: expect.any(String) });
            expect(res.statusCode).toBe(400);

            user.password = PASSWORD_NO_LETTERS;
            res = await request(app)
                .post('/api/v1/admin/register')
                .set('Content-Type', 'application/json')
                .send(invalidUser);
            expect(res.body).toEqual({ error: expect.any(String) });
            expect(res.statusCode).toBe(400);
        });
    });
});
