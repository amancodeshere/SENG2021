import { clear } from '../../userData.js';
import { postRequest } from '../../testHelpers.js';
import {
    VALID_BUSINESS_NAME,
    VALID_EMAIL,
    VALID_PASSWORD,
    SECOND_EMAIL,
    INVALID_EMAIL,
    INVALID_BUSINESS_NAME,
    SHORT_BUSINESS_NAME,
    SHORT_PASSWORD,
    PASSWORD_NO_NUMBERS,
    PASSWORD_NO_LETTERS
} from '../../requestParameterConstants.js';

beforeEach(() => {
    clear();
});
  
describe('adminRegister route - Comprehensive Tests', () => {
    describe('Testing successful adminRegister', () => {
        test('Correct return value', () => {
            const ret = postRequest(
                "/v1/api/admin/register",
                { VALID_BUSINESS_NAME, VALID_EMAIL, VALID_PASSWORD },
                {}
            );
            expect(ret.response).toStrictEqual({ sessionId: expect.any(Number) });
            expect(ret.statusCode).toStrictEqual(200);
        });
  
        test('Same businessName and password does not effect successful registration', () => {
            postRequest(
                "/v1/api/admin/register",
                { VALID_BUSINESS_NAME, VALID_EMAIL, VALID_PASSWORD },
                {}
            );
            const ret = postRequest(
                "/v1/api/admin/register",
                { VALID_BUSINESS_NAME, SECOND_EMAIL, VALID_PASSWORD },
                {}
            );
            expect(ret.response).toStrictEqual({ sessionId: expect.any(Number) });
            expect(ret.statusCode).toStrictEqual(200);
        });
  
        test('two users have unique sessionIds', () => {
            const ret1 = postRequest(
                "/v1/api/admin/register",
                { VALID_BUSINESS_NAME, VALID_EMAIL, VALID_PASSWORD },
                {}
            );
            const user1 = ret1.response;
            const ret2 = postRequest(
                "/v1/api/admin/register",
                { VALID_BUSINESS_NAME, SECOND_EMAIL, VALID_PASSWORD },
                {}
            );
            const user2 = ret2.response;
            expect(user1.sessionId).not.toStrictEqual(user2.sessionId);
        });
    });

    describe('Testing error return values', () => {
        test('email address already in use', () => {
            postRequest(
                "/v1/api/admin/register",
                { VALID_BUSINESS_NAME, VALID_EMAIL, VALID_PASSWORD },
                {}
            );
            const ret = postRequest(
                "/v1/api/admin/register",
                { VALID_BUSINESS_NAME, VALID_EMAIL, VALID_PASSWORD },
                {}
            );
            expect(ret.response).toStrictEqual({ error: expect.any(String) });
            expect(ret.statusCode).toStrictEqual(400);
        });
    
        test('email is not valid', () => {
            const ret = postRequest(
                "/v1/api/admin/register",
                { VALID_BUSINESS_NAME, INVALID_EMAIL, VALID_PASSWORD },
                {}
            );
            expect(ret.response).toStrictEqual({ error: expect.any(String) });
            expect(ret.statusCode).toStrictEqual(400);
        });
  
        test('businessName contains invalid characters', () => {
            const ret = postRequest(
                "/v1/api/admin/register",
                { INVALID_BUSINESS_NAME, VALID_EMAIL, VALID_PASSWORD },
                {}
            );
            expect(ret.response).toStrictEqual({ error: expect.any(String) });
            expect(ret.statusCode).toStrictEqual(400);
        });
  
        test('businessName is less than 2 characters', () => {
            let ret = postRequest(
                "/v1/api/admin/register",
                { SHORT_BUSINESS_NAME, VALID_EMAIL, VALID_PASSWORD },
                {}
            );
            expect(ret.response).toStrictEqual({ error: expect.any(String) });
            expect(ret.statusCode).toStrictEqual(400);
        });
  
        test('password is less than 8 characters', () => {
            const ret = postRequest(
                "/v1/api/admin/register",
                { VALID_BUSINESS_NAME, VALID_EMAIL, SHORT_PASSWORD },
                {}
            );
            expect(ret.response).toStrictEqual({ error: expect.any(String) });
            expect(ret.statusCode).toStrictEqual(400);
        });
  
        test('password does not contain at least one number and at least one letter', () => {
            let ret = postRequest(
                "/v1/api/admin/register",
                { VALID_BUSINESS_NAME, VALID_EMAIL, PASSWORD_NO_NUMBERS },
                {}
            );
            expect(ret.response).toStrictEqual({ error: expect.any(String) });
            expect(ret.statusCode).toStrictEqual(400);
    
            ret = postRequest(
                "/v1/api/admin/register",
                { VALID_BUSINESS_NAME, VALID_EMAIL, PASSWORD_NO_LETTERS },
                {}
            );
            expect(ret.response).toStrictEqual({ error: expect.any(String) });
            expect(ret.statusCode).toStrictEqual(400);
        });
    });
});
