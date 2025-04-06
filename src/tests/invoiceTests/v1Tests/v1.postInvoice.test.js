import request from 'supertest';
import { app } from '../../../app.js';
import { db } from '../../../connect.js';
import * as orderModule from '../../../orderToDB.js';
import * as invoiceModule from '../../../invoiceToDB.js';

jest.mock('../../../connect.js', () => ({
    db: {
        exec: jest.fn(),
        get: jest.fn(),
        run: jest.fn(),
        all: jest.fn(),
    },
}));jest.mock('../../../orderToDB.js');
jest.mock('../../../invoiceToDB.js');
jest.mock('ubl-builder', () => {
  return {
    UBLBuilder: jest.fn().mockImplementation(() => ({
      parseInvoiceXML: jest.fn().mockImplementation(() => ({
        getOrderReference: jest.fn().mockReturnValue({
          getID: jest.fn().mockReturnValue('12345678')
        }),
        getIssueDate: jest.fn().mockReturnValue('2025-03-06'),
        getAccountingCustomerParty: jest.fn().mockReturnValue({
          getParty: jest.fn().mockReturnValue({
            getPartyName: jest.fn().mockReturnValue({
              getName: jest.fn().mockReturnValue('ABC Corp')
            })
          })
        }),
        getLegalMonetaryTotal: jest.fn().mockReturnValue({
          getPayableAmount: jest.fn().mockImplementation(function() {
            return {
              getCurrencyID: jest.fn().mockReturnValue('USD')
            };
          }).mockReturnValue(500)
        })
      }))
    }))
  };
});

describe('POST /api/v1/invoice/create', () => {
  const validSessionId = '123456';
  
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

  const validJSONDocument = {
    SalesOrderID: "12345678",
    IssueDate: "2025-03-06",
    PartyName: "ABC Corp",
    PayableAmount: 500,
    CurrencyCode: "USD"
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default db get mock for session validation
    db.get.mockImplementation((query, params, callback) => {
      if (query.includes('FROM sessions') && params[0] === validSessionId) {
        callback(null, { sessionId: validSessionId });
      } else {
        callback(null, null);
      }
    });

    // Mock inputOrder and inputInvoice functions
    orderModule.inputOrder.mockImplementation((UUID, IssueDate, PartyName, PayableAmount, PayableCurrencyCode, Items, callback) => {
      callback(null, { orderId: 1 });
    });
    
    invoiceModule.inputInvoice.mockImplementation((SalesOrderId, callback) => {
      callback(null, { InvoiceID: 1 });
    });
  });

  test('should successfully create invoice from XML document', async () => {
    const response = await request(app)
      .post('/api/v1/invoice/create')
      .set('sessionid', validSessionId)
      .set('Content-Type', 'application/xml')
      .send(validXMLDocument);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ invoiceId: 1 });
    expect(orderModule.inputOrder).toHaveBeenCalled();
    expect(invoiceModule.inputInvoice).toHaveBeenCalled();
  });

  test('should successfully create invoice from JSON document', async () => {
    const response = await request(app)
      .post('/api/v1/invoice/create')
      .set('sessionid', validSessionId)
      .set('Content-Type', 'application/json')
      .send(validJSONDocument);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ invoiceId: 1 });
    expect(orderModule.inputOrder).toHaveBeenCalled();
    expect(invoiceModule.inputInvoice).toHaveBeenCalled();
  });

  test('should return error when sessionId is missing', async () => {
    const response = await request(app)
      .post('/api/v1/invoice/create')
      .set('Content-Type', 'application/json')
      .send(validJSONDocument);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid session ID' });
  });

  test('should return error when sessionId is invalid', async () => {
    const response = await request(app)
      .post('/api/v1/invoice/create')
      .set('sessionid', 'invalid-session-id')
      .set('Content-Type', 'application/json')
      .send(validJSONDocument);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid session ID' });
  });

  test('should return error when document is missing', async () => {
    const response = await request(app)
      .post('/api/v1/invoice/create')
      .set('sessionid', validSessionId)
      .set('Content-Type', 'application/json')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Missing required fields in document' });
  });

  test('should handle malformed XML document', async () => {
    const malformedXML = '<invalid>xml</invalid>';

    const response = await request(app)
      .post('/api/v1/invoice/create')
      .set('sessionid', validSessionId)
      .set('Content-Type', 'application/xml')
      .send(malformedXML);

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  test('should handle database error during session validation', async () => {
    db.get.mockImplementationOnce((query, params, callback) => {
      callback(new Error('Database error'), null);
    });

    const response = await request(app)
      .post('/api/v1/invoice/create')
      .set('sessionid', validSessionId)
      .set('Content-Type', 'application/json')
      .send(validJSONDocument);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal session validation error' });
  });

  test('should handle order creation error', async () => {
    orderModule.inputOrder.mockImplementationOnce((UUID, IssueDate, PartyName, PayableAmount, PayableCurrencyCode, Items, callback) => {
      callback(new Error('Order creation failed'));
    });

    const response = await request(app)
      .post('/api/v1/invoice/create')
      .set('sessionid', validSessionId)
      .set('Content-Type', 'application/json')
      .send(validJSONDocument);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Order creation failed' });
  });

  test('parseXML error - not XML', async () => {
    const response = await request(app)
      .post('/api/v1/invoice/create')
      .set('sessionid', validSessionId)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid content type" });
  });

  test('failed to create invoice', async () => {
    invoiceModule.inputInvoice.mockImplementationOnce((SalesOrderId, callback) => {
      callback(new Error('Invoice creation failed'));
    });
    const response = await request(app)
      .post('/api/v1/invoice/create')
      .set('sessionid', validSessionId)
      .set('Content-Type', 'application/json')
      .send(validJSONDocument);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invoice creation failed' });
  });


});