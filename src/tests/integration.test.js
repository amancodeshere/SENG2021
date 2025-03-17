import request from 'supertest';
import expect from 'expect';
import fs from 'fs';
import { app } from '../app.js';

// constants for request parameters
const VALID_EMAIL = 'val@gmail.com';
const VALID_COMPANY_NAME = 'Valid Pty Ltd';
const VALID_PASSWORD = 'Password123';

beforeAll(() => {
    fs.copyFile("./database.db", "./database.copy.db", (err) => {
        if (err) {
            console.error(`Error copying file: ${err}`);
        }
    });
});

afterAll(() => {
    fs.copyFile("./database.copy.db", "./database.db", (err) => {
        if (err) {
            console.error(`Error copying file: ${err}`);
        }
    });
    fs.unlink("./database.copy.db", (err) => {
        if (err) {
            console.error(`Error removing file: ${err}`);
        }
    })
});



describe('Intergration tests for all routes', () => {

    const user = {
        companyName: VALID_COMPANY_NAME,
        email: VALID_EMAIL,
        password: VALID_PASSWORD
    };

    const validJSONDocument = {
        SalesOrderID: "12345678",
        IssueDate: "2025-03-06",
        PartyName: "ABC Corp",
        PayableAmount: 500,
        CurrencyCode: "USD"
    };

    const validJSONDocument2 = {
        SalesOrderID: "87654321",
        IssueDate: "2025-03-06",
        PartyName: "ABC Corp",
        PayableAmount: 500,
        CurrencyCode: "USD"
    };

    test("user successfully creates, views and exports multiple invoices", async () => {
        
       
        // health check
         var res = await request(app)
             .get('/api/health');
        
        // expect(res.body.status).toEqual('success');

        // register user
         res = await request(app)
            .post('/api/v1/admin/register')
            .set('Content-Type', 'application/json')
            .send(user);
        
        expect(res.body).toEqual({ sessionId:  expect.any(Number)});
        expect(res.status).toBe(200);

        var sessionId = res.body.sessionId;

        // input invoice into database from XML order
        res = await request(app)
              .post('/api/v1/invoice/create')
              .set('sessionid', sessionId)
              .set('Content-Type', 'application/json')
              .send(validJSONDocument);
        
        expect(res.body).toEqual({ invoiceId: expect.any(Number) });
        expect(res.status).toBe(200);

        var invoiceId1 = res.body.invoiceId;

        // view invoice
        res = await request(app)
            .get(`/api/v1/invoice/${invoiceId1}`)
            .set('sessionid', sessionId);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            invoiceId: invoiceId1,
            salesOrderID: 12345678,
            issueDate: "2025-03-06",
            partyNameBuyer: "ABC Corp",
            payableAmount: "USD 500",
            items: [
                {
                    description: "Default Item",
                    amount: "500 EA"
                }
            ]
        });

        // convert invoice into xml
        res = await request(app)
            .get(`/api/v1/invoice/${invoiceId1}/xml`)
            .set('sessionid', sessionId);

        expect(res.status).toBe(200);

        expect(res.text).toContain('<?xml version="1.0" encoding="UTF-8"');
            expect(res.text).toContain("<Invoice");
            expect(res.text).toContain(`<cbc:ID>${invoiceId1}</`);
            expect(res.text).toContain("<cbc:IssueDate>2025-03-06</");
            expect(res.text).toContain("<cbc:DocumentCurrencyCode>USD</");
            expect(res.text).toContain("<cbc:SalesOrderID>12345678</");
            expect(res.text).toContain("<cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>Valid Pty Ltd</");
            expect(res.text).toContain("<cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>ABC Corp</");
            expect(res.text).toContain("<cbc:PayableAmount>500</");
            expect(res.text).toContain("<cbc:PayableAmount>500</");
            expect(res.text).toContain("<cac:InvoiceLine><cbc:ID>1</");
            expect(res.text).toContain("<cbc:InvoicedQuantity>500</");
            expect(res.text).toContain("<cbc:LineExtensionAmount>500</");
            expect(res.text).toContain("<cac:Item><cbc:Name>Default Item</");
        
        // input second invoice
        res = await request(app)
            .post('/api/v1/invoice/create')
            .set('sessionid', sessionId)
            .set('Content-Type', 'application/json')
            .send(validJSONDocument2);
    
        expect(res.body).toEqual({ invoiceId: expect.any(Number) });
        expect(res.status).toBe(200);


        var invoiceId2 = res.body.invoiceId;

        // view second invoice 
        res = await request(app)
            .get(`/api/v1/invoice/${invoiceId2}`)
            .set('sessionid', sessionId);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            invoiceId: invoiceId2,
            salesOrderID: 87654321,
            issueDate: "2025-03-06",
            partyNameBuyer: "ABC Corp",
            payableAmount: "USD 500",
            items: [
                {
                    description: "Default Item",
                    amount: "500 EA"
                }
            ]
        });

        res = await request(app)
            .get('/api/v1/invoices/list')
            .set('sessionid', sessionId)
            .query({ partyNameBuyer: 'ABC Corp' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            {
                invoiceId: invoiceId1,
                salesOrderID: 12345678,
                issueDate: "2025-03-06",
                partyNameBuyer: "ABC Corp",
                payableAmount: "USD 500"
            },
            {
                invoiceId: invoiceId2,
                salesOrderID: 87654321,
                issueDate: "2025-03-06",
                partyNameBuyer: "ABC Corp",
                payableAmount: "USD 500"
            }
        ]);

    });


});