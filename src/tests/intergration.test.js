import request from 'supertest';
import { app } from '../app.js';
import expect from 'expect';

// constants for request parameters
const VALID_EMAIL = 'valid@gmail.com';
const VALID_COMPANY_NAME = 'Valid Pty Ltd';
const VALID_PASSWORD = 'Password123';
const SECOND_EMAIL = 'candle.craft@gmail.com'
const SECOND_COMPANY_NAME = 'Candlecraft Pty Ltd';

describe('Intergration tests for all routes', () => {
    const user = {
        companyName: VALID_COMPANY_NAME,
        email: VALID_EMAIL,
        password: VALID_PASSWORD
    };
    const validXMLDocument = `
        <?xml version="1.0" encoding="UTF-8"?>
        <order>
            <SalesOrderID>12345678</SalesOrderID>
            <IssueDate>2025-03-06</IssueDate>
            <PartyName>ABC Corp</PartyName>
            <PayableAmount>500</PayableAmount>
            <CurrencyCode>USD</CurrencyCode>
        </order>
    `;
    const validJSONDocument = {
        SalesOrderID: "12345678",
        IssueDate: "2025-03-06",
        PartyName: "ABC Corp",
        PayableAmount: 500,
        CurrencyCode: "USD"
    };


    test("Single user successfully creates and exports an XML invoice", async () => {
        var res = await request(app)
            .post('/api/v1/admin/register')
            .set('Content-Type', 'application/json')
            .send(user);
        
        expect(res.body).toEqual({ sessionId:  expect.any(Number)});
        expect(res.status).toBe(200);

        var sessionId = res.body.sessionId;

        res = await request(app)
            .post('/api/v1/invoice')
            .set('sessionId', sessionId)
            .set('Content-Type', 'application/xml')
            .send(validXMLDocument);
        
        expect(res.body).toEqual({ invoiceId: expect.any(Number) });
        expect(response.status).toBe(200);

        var invoiceId = res.body.invoiceId;

        

    });
});