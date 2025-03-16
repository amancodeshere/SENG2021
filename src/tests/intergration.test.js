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

describe('Intergration tests for all routes', () => {
    const user = {
        companyName: VALID_COMPANY_NAME,
        email: VALID_EMAIL,
        password: VALID_PASSWORD
    };
    test("Single user successfully creates and exports an XML invoice", async () => {
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
});