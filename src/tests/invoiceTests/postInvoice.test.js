import request from 'supertest';
import { app } from '../../app.js';
import { db } from '../../connect.js';
import * as orderModule from '../../orderToDB.js';
import * as invoiceModule from '../../invoiceToDB.js';


jest.mock('../../connect.js', () => ({
  db: { query: jest.fn() }
}));
jest.mock('../../orderToDB.js', () => ({ inputOrder: jest.fn() }));
jest.mock('../../invoiceToDB.js', () => ({ inputInvoice: jest.fn() }));


describe('POST /api/v2/invoice/create', () => {
  const goodSessionId = 42;
  const jsonDoc = {
    IssueDate:     "2025-01-01",
    PartyName:     "BuyerCo",
    PayableAmount: 100,
    CurrencyCode:  "USD",
    Items: [{
      OrderItemId:      "ITEM1",
      ItemName:         "Test",
      ItemDescription:  "Desc",
      ItemPrice:        25,
      ItemQuantity:     4,
      ItemUnitCode:     "EA"
    }]
  };
  const xmlDoc = `
    <?xml version="1.0"?>
    <Order xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
           xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
      <cbc:IssueDate>2025-01-01</cbc:IssueDate>
      <cac:BuyerCustomerParty>
        <cac:Party>
          <cac:PartyName><cbc:Name>BuyerCo</cbc:Name></cac:PartyName>
        </cac:Party>
      </cac:BuyerCustomerParty>
      <cac:AnticipatedMonetaryTotal>
        <cbc:PayableAmount currencyID="USD">100</cbc:PayableAmount>
      </cac:AnticipatedMonetaryTotal>
      <cac:OrderLine>
        <cac:LineItem>
          <cbc:ID>1</cbc:ID>
          <cbc:Quantity unitCode="EA">4</cbc:Quantity>
          <cac:Price>
            <cbc:PriceAmount currencyID="USD">25</cbc:PriceAmount>
          </cac:Price>
          <cac:Item>
            <cbc:Name>Test</cbc:Name>
            <cbc:Description>Desc</cbc:Description>
          </cac:Item>
        </cac:LineItem>
      </cac:OrderLine>
    </Order>
  `;


  beforeEach(() => {
    jest.clearAllMocks();
    // session+user join
    db.query.mockResolvedValue({ rows: [{ companyname: 'SellerCo' }] });
    // normal insert mocks
    orderModule.inputOrder.mockImplementation((...args) => {
      const cb = args[args.length - 1];
      cb(null, { success: true });
    });
    invoiceModule.inputInvoice.mockImplementation((...args) => {
      const cb = args[args.length - 1];
      cb(null, { InvoiceID: 99 });
    });
  });


  it('200 + invoiceId for valid JSON', async () => {
    const res = await request(app)
        .post('/api/v2/invoice/create')
        .set('sessionid', String(goodSessionId))
        .set('Content-Type', 'application/json')
        .send(jsonDoc);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ invoiceId: 99 });
    expect(orderModule.inputOrder).toHaveBeenCalled();
    expect(invoiceModule.inputInvoice).toHaveBeenCalled();
  });


  it('200 + invoiceId for valid XML', async () => {
    const res = await request(app)
        .post('/api/v2/invoice/create')
        .set('sessionid', String(goodSessionId))
        .set('Content-Type', 'application/xml')
        .send(xmlDoc);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ invoiceId: 99 });
    expect(orderModule.inputOrder).toHaveBeenCalled();
    expect(invoiceModule.inputInvoice).toHaveBeenCalled();
  });


  it('401 if session header missing', async () => {
    const res = await request(app)
        .post('/api/v2/invoice/create')
        .set('Content-Type', 'application/json')
        .send(jsonDoc);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid session ID' });
  });


  it('401 if session not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
        .post('/api/v2/invoice/create')
        .set('sessionid', '999')
        .set('Content-Type', 'application/json')
        .send(jsonDoc);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid session ID' });
  });


  it('500 on DB error during session lookup', async () => {
    db.query.mockRejectedValueOnce(new Error('boom'));
    const res = await request(app)
        .post('/api/v2/invoice/create')
        .set('sessionid', String(goodSessionId))
        .set('Content-Type', 'application/json')
        .send(jsonDoc);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal session/user validation error' });
  });


  it('400 if JSON missing fields', async () => {
    const res = await request(app)
        .post('/api/v2/invoice/create')
        .set('sessionid', String(goodSessionId))
        .set('Content-Type', 'application/json')
        .send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing required fields in JSON payload' });
  });


  it('400 if XML malformed', async () => {
    const res = await request(app)
        .post('/api/v2/invoice/create')
        .set('sessionid', String(goodSessionId))
        .set('Content-Type', 'application/xml')
        .send('<not>valid</not>');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });


  it('400 if order creation fails', async () => {
    orderModule.inputOrder.mockImplementationOnce((...args) => {
      const cb = args[args.length - 1];
      cb(new Error('order failed'));
    });
    const res = await request(app)
        .post('/api/v2/invoice/create')
        .set('sessionid', String(goodSessionId))
        .set('Content-Type', 'application/json')
        .send(jsonDoc);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Order creation failed: order failed' });
  });


  it('400 if invoice creation fails', async () => {
    invoiceModule.inputInvoice.mockImplementationOnce((...args) => {
      const cb = args[args.length - 1];
      cb(new Error('invoice failed'));
    });
    const res = await request(app)
        .post('/api/v2/invoice/create')
        .set('sessionid', String(goodSessionId))
        .set('Content-Type', 'application/json')
        .send(jsonDoc);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invoice creation failed: invoice failed' });
  });
});