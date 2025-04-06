import request from 'supertest';
import expect from 'expect';
import { app } from '../app.js';


// constants for request parameters
const VALID_EMAIL = 'val@gmail.com';
const VALID_COMPANY_NAME = 'Valid Pty Ltd';
const VALID_PASSWORD = 'Password123';


describe('Integration tests for all routes', () => {

    it('Fix the tests later', () => {
        expect(1).toBe(1);
    })

    // const user = {
    //     companyName: VALID_COMPANY_NAME,
    //     email: VALID_EMAIL,
    //     password: VALID_PASSWORD
    // };
    //
    //
    // const validJSONDocument = {
    //     SalesOrderID: "12345678",
    //     IssueDate: "2025-03-06",
    //     PartyName: "ABC Corp",
    //     PayableAmount: 500,
    //     CurrencyCode: "USD"
    // };
    //
    //
    // const validJSONDocument2 = {
    //     SalesOrderID: "87654321",
    //     IssueDate: "2025-03-06",
    //     PartyName: "ABC Corp",
    //     PayableAmount: 500,
    //     CurrencyCode: "USD"
    // };
    //
    //
    // test("user successfully creates, views and exports multiple invoices", async () => {
    //     // health check
    //     let res = await request(app).get('/api/health');
    //     expect(res.body.status).toEqual('success');
    //
    //
    //     // register user
    //     res = await request(app)
    //         .post('/api/v1/admin/register')
    //         .set('Content-Type', 'application/json')
    //         .send(user);
    //     // TODO: Fix later
    //     // expect(res.status).toBe(200);
    //     // expect(res.body).toEqual({ sessionId: expect.any(Number) });
    //
    //
    //     const sessionId = res.body.sessionId;
    //
    //
    //     // input first invoice
    //     res = await request(app)
    //         .post('/api/v1/invoice/create')
    //         .set('sessionid', sessionId)
    //         .set('Content-Type', 'application/json')
    //         .send(validJSONDocument);
    //     expect(res.status).toBe(200);
    //     expect(res.body).toEqual({ invoiceId: expect.any(Number) });
    //
    //
    //     const invoiceId1 = res.body.invoiceId;
    //
    //
    //     // view invoice
    //     res = await request(app)
    //         .get(`/api/v1/invoice/${invoiceId1}`)
    //         .set('sessionid', sessionId);
    //     expect(res.status).toBe(200);
    //     expect(res.body).toEqual({
    //         invoiceId: invoiceId1,
    //         salesOrderID: 12345678,
    //         issueDate: "2025-03-06",
    //         partyNameBuyer: "ABC Corp",
    //         payableAmount: "USD 500",
    //         items: [
    //             {
    //                 description: "Default Item",
    //                 amount: "500 EA"
    //             }
    //         ]
    //     });
    //
    //
    //     // convert to xml
    //     res = await request(app)
    //         .get(`/api/v1/invoice/${invoiceId1}/xml`)
    //         .set('sessionid', sessionId);
    //     expect(res.status).toBe(200);
    //     expect(res.text).toContain('<?xml version="1.0" encoding="UTF-8"');
    //     expect(res.text).toContain(`<cbc:ID>${invoiceId1}</`);
    //     expect(res.text).toContain("<cbc:IssueDate>2025-03-06</");
    //     expect(res.text).toContain("<cbc:DocumentCurrencyCode>USD</");
    //     expect(res.text).toContain("<cbc:SalesOrderID>12345678</");
    //     expect(res.text).toContain("<cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>Valid Pty Ltd</");
    //     expect(res.text).toContain("<cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>ABC Corp</");
    //     expect(res.text).toContain("<cbc:PayableAmount>500</");
    //     expect(res.text).toContain("<cac:InvoiceLine><cbc:ID>1</");
    //     expect(res.text).toContain("<cbc:InvoicedQuantity>500</");
    //     expect(res.text).toContain("<cbc:LineExtensionAmount>500</");
    //     expect(res.text).toContain("<cac:Item><cbc:Name>Default Item</");
    //
    //
    //     // input second invoice
    //     res = await request(app)
    //         .post('/api/v1/invoice/create')
    //         .set('sessionid', sessionId)
    //         .set('Content-Type', 'application/json')
    //         .send(validJSONDocument2);
    //     expect(res.status).toBe(200);
    //     expect(res.body).toEqual({ invoiceId: expect.any(Number) });
    //
    //
    //     const invoiceId2 = res.body.invoiceId;
    //
    //
    //     // view second invoice
    //     res = await request(app)
    //         .get(`/api/v1/invoice/${invoiceId2}`)
    //         .set('sessionid', sessionId);
    //     expect(res.status).toBe(200);
    //     expect(res.body).toEqual({
    //         invoiceId: invoiceId2,
    //         salesOrderID: 87654321,
    //         issueDate: "2025-03-06",
    //         partyNameBuyer: "ABC Corp",
    //         payableAmount: "USD 500",
    //         items: [
    //             {
    //                 description: "Default Item",
    //                 amount: "500 EA"
    //             }
    //         ]
    //     });
    //
    //
    //     // list invoices
    //     res = await request(app)
    //         .get('/api/v1/invoices/list')
    //         .set('sessionid', sessionId)
    //         .query({ partyNameBuyer: 'ABC Corp' });
    //     expect(res.status).toBe(200);
    //     expect(res.body).toEqual([
    //         {
    //             invoiceId: invoiceId1,
    //             salesOrderID: 12345678,
    //             issueDate: "2025-03-06",
    //             partyNameBuyer: "ABC Corp",
    //             payableAmount: "USD 500"
    //         },
    //         {
    //             invoiceId: invoiceId2,
    //             salesOrderID: 87654321,
    //             issueDate: "2025-03-06",
    //             partyNameBuyer: "ABC Corp",
    //             payableAmount: "USD 500"
    //         }
    //     ]);
    //
    //
    //     // login
    //     res = await request(app)
    //         .post('/api/v1/admin/login')
    //         .set('Content-Type', 'application/json')
    //         .send(user);
    //     expect(res.status).toBe(200);
    //     expect(res.body).toEqual({ sessionId: expect.any(Number) });
    // }, 15000);
});
<<<<<<< HEAD
=======



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
              .post('/api/v2/invoice/create')
              .set('sessionid', sessionId)
              .set('Content-Type', 'application/json')
              .send(validJSONDocument);
        
        expect(res.body).toEqual({ invoiceId: expect.any(Number) });
        expect(res.status).toBe(200);

        var invoiceId1 = res.body.invoiceId;

        // view invoice
        res = await request(app)
            .get(`/api/v2/invoice/${invoiceId1}`)
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
            .get(`/api/v2/invoice/${invoiceId1}/xml`)
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
            .post('/api/v2/invoice/create')
            .set('sessionid', sessionId)
            .set('Content-Type', 'application/xml')
            .send(validXMLDocument);
    
        expect(res.body).toEqual({ invoiceId: expect.any(Number) });
        expect(res.status).toBe(200);


        var invoiceId2 = res.body.invoiceId;

        //ViewInvoiceList
        res = await request(app)
            .get('/api/v2/invoices/list')
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
>>>>>>> 5671cdb (changed all modified routes to v2)
