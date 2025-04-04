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
        IssueDate: "2025-03-06",
        PartyName: "ABC Corp",
        PayableAmount: 500,
        CurrencyCode: "USD",
        Items:[{
            Id: "1",
            ItemName: "new Item",
            ItemDescription: "This is an item",
            ItemPrice: 250,
            ItemQuantity: 2,
            ItemUnitCode: "PCS"
        }]
    };

    const validXMLDocument = fs.readFileSync("./order2.xml", "utf-8");

    //All the integration testing happens in the 1 test case because tests are run
    //concurrently and so accessing the database in multiple tests can cause issues
    test("user successfully creates, views and exports multiple invoices", async () => {
        
        // health check
         var res = await request(app)
             .get('/api/health');
        
        expect(res.body.status).toEqual('success');

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
            issueDate: "2025-03-06",
            partyNameBuyer: "ABC Corp",
            payableAmount: "USD 500",
            items: [
                {
                    name: "new Item",
                    description: "This is an item",
                    price: "USD 250",
                    quantity: "2 PCS",
                }
            ]
        });

        // convert invoice into xml
        res = await request(app)
            .get(`/api/v1/invoice/${invoiceId1}/xml`)
            .set('sessionid', sessionId);

        expect(res.status).toBe(200);
        
        //validate the xml invoice that was generated
        var xml = res.text;
        res = await request(app).post('/api/v1/invoice/validate')
                                      .set("Content-Type", "application/json")
                                      .send({ invoice: xml })
       
        expect(res.status).toBe(200);
        expect(res.body.validated).toBe(true);

        // input second invoice
        res = await request(app)
            .post('/api/v1/invoice/create')
            .set('sessionid', sessionId)
            .set('Content-Type', 'application/xml')
            .send(validXMLDocument);
    
        expect(res.body).toEqual({ invoiceId: expect.any(Number) });
        expect(res.status).toBe(200);


        var invoiceId2 = res.body.invoiceId;

        //ViewInvoiceList
        res = await request(app)
            .get('/api/v1/invoices/list')
            .set('sessionid', sessionId)
            .query({ partyNameBuyer: 'ABC Corp' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            {
                invoiceId: invoiceId1,
                issueDate: "2025-03-06",
                partyNameBuyer: "ABC Corp",
                payableAmount: "USD 500"
            },
            {
                invoiceId: invoiceId2,
                issueDate: "2010-01-20",
                partyNameBuyer: "ABC Corp",
                payableAmount: "SEK 6225"
            }
        ]);

        //start a new session with login
        res = await request(app)
            .post('/api/v1/admin/login')
            .set('Content-Type', 'application/json')
            .send(user);
        expect(res.body).toEqual({ sessionId: expect.any(Number) });
        expect(res.status).toBe(200);
    

       

    }, 15000);


});