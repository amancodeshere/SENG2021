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
    const validXMLDocument = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
       xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
       xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>12345678</cbc:ID>
  <cbc:IssueDate>2025-03-06</cbc:IssueDate>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>ABC Corp</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="USD">500</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:OrderReference>
    <cbc:ID>12345678</cbc:ID>
  </cac:OrderReference>
</Invoice>`;


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

        res = await request(app)
            .get(`/api/v1/invoice/${invoiceId}/xml`)
            .set('sessionid', sessionId);

        

        

    });
});