import request from 'supertest';
import { app } from '../../app.js';
import { validateUser, updateUserSession } from '../../UsersToDB.js';

// constants for request parameters
const VALID_EMAIL = 'valid@gmail.com';
const VALID_PASSWORD = 'Password123';
const SECOND_EMAIL = 'candle.craft@gmail.com'
const INCORRECT_EMAIL = 'incorrect@gmail.com';
const INCORRECT_PASSWORD = 'incorrect123';
const USERID1 = 123;
const SESSIONID1 = 456;
const USERID2 = 789;
const SESSIONID2 = 101;

jest.mock('../../UsersToDB.js', () => ({
    validateUser: jest.fn(),
    updateUserSession: jest.fn()
}));

beforeEach(() => {
    jest.clearAllMocks();
});
  
describe('adminLogin route - Comprehensive Tests', () => {
    const user = {
        email: VALID_EMAIL,
        password: VALID_PASSWORD
    };

    describe('Testing successful adminLogin', () => {
        test('Correct return value', async () => {
            validateUser.mockImplementationOnce((email, password, callback) => {
                callback(null, true);
            });
            updateUserSession.mockImplementationOnce((email, callback) => {
                callback(null, {
                    success: true,
                    message: "New session created.",
                    userID: USERID1,
                    sessionID: SESSIONID1
                });
            });
            const res = await request(app)
                .post('/api/v1/admin/login')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res.body).toEqual({ sessionId: SESSIONID1 });
            expect(res.status).toBe(200);
        });
  
        test('login multiple users successfully', async () => {
            const user2 = {
                email: SECOND_EMAIL,
                password: VALID_PASSWORD
            };
            validateUser.mockImplementation((email, password, callback) => {
                callback(null, true);
            });
            updateUserSession
                .mockImplementationOnce((email, callback) => {
                    callback(null, {
                        success: true,
                        message: "New session created.",
                        userID: USERID1,
                        sessionID: SESSIONID1
                    });
                })
                .mockImplementationOnce((email, callback) => {
                    callback(null, {
                        success: true,
                        message: "New session created.",
                        userID: USERID2,
                        sessionID: SESSIONID2
                    });
                });
            const res = await request(app)
                .post('/api/v1/admin/login')
                .set('Content-Type', 'application/json')
                .send(user);
            expect(res.body).toEqual({ sessionId: SESSIONID1 });
            expect(res.status).toBe(200);

            const res2 = await request(app)
                .post('/api/v1/admin/login')
                .set('Content-Type', 'application/json')
                .send(user2);
            expect(res2.body).toEqual({ sessionId: SESSIONID2 });
            expect(res2.status).toBe(200);
        });
    });

    describe('Testing error return values', () => {
        test('no account with this email is registered', async () => {
            const invalidUser = {
                email: INCORRECT_EMAIL,
                password: VALID_PASSWORD
            };
            validateUser.mockImplementationOnce((email, password, callback) => {
                callback(new Error("Database error while validating user."), false);
            });
            const res = await request(app)
                .post('/api/v1/admin/login')
                .set('Content-Type', 'application/json')
                .send(invalidUser);
            expect(res.body).toEqual({ error: "Database error while validating user." });
            expect(res.statusCode).toBe(400);
        });
  
        test('password is incorrect', async () => {
            const invalidUser = {
                email: VALID_EMAIL,
                password: INCORRECT_PASSWORD
            };
            validateUser.mockImplementationOnce((email, password, callback) => {
                callback(new Error("Error processing password validation."), false);
            });
            const res = await request(app)
                .post('/api/v1/admin/login')
                .set('Content-Type', 'application/json')
                .send(invalidUser);
            expect(res.body).toEqual({ error: "Error processing password validation." });
            expect(res.statusCode).toBe(400);
        });
    });
});
