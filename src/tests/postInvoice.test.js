import request from 'supertest';
import { app } from '../server.js';
import { db } from '../connect.js';

jest.mock('../connect.js', () => ({
    db: {
        exec: jest.fn(),
        get: jest.fn(),
        run: jest.fn(),
        all: jest.fn(),
    },
}));

describe('POST /api/invoice', () => {
    const validSessionId = 'valid-session-id';
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

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should successfully create invoice from XML document', async () => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, {
            IssueDate: "2025-03-06",
            PartyNameBuyer: "ABC Corp",
            PayableAmount: 500,
            CurrencyCode: "USD"
        }));
        db.run.mockImplementationOnce((sql, params, callback) => {
            db.lastID = 1;
            callback(null);
        });
        db.all.mockImplementationOnce((sql, params, callback) => callback(null, [{
            ItemDescription: "Test Item",
            BuyersItemIdentification: "123",
            SellersItemIdentification: "456",
            ItemAmount: 500,
            ItemUnitCode: "PCS"
        }]));
        db.run.mockImplementationOnce((sql, params, callback) => callback(null));
        db.exec.mockImplementationOnce((sql, callback) => callback(null)); // Commit transaction

        const response = await request(app)
            .post('/api/invoice')
            .set('sessionId', validSessionId)
            .set('Content-Type', 'application/xml')
            .send(validXMLDocument);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ invoiceId: 1 });
    });

    test('should successfully create invoice from JSON document', async () => {
        // Mock successful database operations
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, {
            IssueDate: "2025-03-06",
            PartyNameBuyer: "ABC Corp",
            PayableAmount: 500,
            CurrencyCode: "USD"
        }));
        db.run.mockImplementationOnce((sql, params, callback) => {
            db.lastID = 1;
            callback(null);
        });
        db.all.mockImplementationOnce((sql, params, callback) => callback(null, [{
            ItemDescription: "Test Item",
            BuyersItemIdentification: "123",
            SellersItemIdentification: "456",
            ItemAmount: 500,
            ItemUnitCode: "PCS"
        }]));
        db.run.mockImplementationOnce((sql, params, callback) => callback(null));
        db.exec.mockImplementationOnce((sql, callback) => callback(null));

        const response = await request(app)
            .post('/api/invoice')
            .set('sessionId', validSessionId)
            .set('Content-Type', 'application/json')
            .send(validJSONDocument);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ invoiceId: 1 });
    });

    test('should return error when sessionId is missing', async () => {
        const response = await request(app)
            .post('/api/invoice')
            .set('Content-Type', 'application/json')
            .send(validJSONDocument);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid session ID' });
    });

    test('should return error when sessionId is invalid', async () => {
        const response = await request(app)
            .post('/api/invoice')
            .set('sessionId', 'invalid-session-id')
            .set('Content-Type', 'application/json')
            .send(validJSONDocument);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid session ID' });
    });

    test('should return error when document is missing', async () => {
        const response = await request(app)
            .post('/api/invoice')
            .set('sessionId', validSessionId)
            .set('Content-Type', 'application/json')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Document is required' });
    });

    test('should return error when document format is invalid', async () => {
        const response = await request(app)
            .post('/api/invoice')
            .set('sessionId', validSessionId)
            .set('Content-Type', 'application/json')
            .send('invalid document');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid document format' });
    });

    test('should return error when database transaction fails', async () => {
        db.exec.mockImplementationOnce((sql, callback) => callback(new Error('Database error')));

        const response = await request(app)
            .post('/api/invoice')
            .set('sessionId', validSessionId)
            .set('Content-Type', 'application/json')
            .send(validJSONDocument);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Database error while creating invoice' });
    });

    test('should return error when order not found', async () => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, null));

        const response = await request(app)
            .post('/api/invoice')
            .set('sessionId', validSessionId)
            .set('Content-Type', 'application/json')
            .send(validJSONDocument);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Order not found' });
    });

    test('should return error when no items found for order', async () => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, {
            IssueDate: "2025-03-06",
            PartyNameBuyer: "ABC Corp",
            PayableAmount: 500,
            CurrencyCode: "USD"
        }));
        db.run.mockImplementationOnce((sql, params, callback) => {
            db.lastID = 1;
            callback(null);
        });
        db.all.mockImplementationOnce((sql, params, callback) => callback(null, []));

        const response = await request(app)
            .post('/api/invoice')
            .set('sessionId', validSessionId)
            .set('Content-Type', 'application/json')
            .send(validJSONDocument);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'No items found for this order' });
    });

    test('should handle malformed XML document', async () => {
        const malformedXML = '<invalid>xml</invalid>';

        const response = await request(app)
            .post('/api/invoice')
            .set('sessionId', validSessionId)
            .set('Content-Type', 'application/xml')
            .send(malformedXML);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid XML document' });
    });

    test('should handle missing required fields in document', async () => {
        const incompleteJSON = {
            IssueDate: "2025-03-06",
            PartyName: "ABC Corp"
        };

        const response = await request(app)
            .post('/api/invoice')
            .set('sessionId', validSessionId)
            .set('Content-Type', 'application/json')
            .send(incompleteJSON);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Missing required fields in document' });
    });
}); 

// May need to add test cases for other scenarios such as:
// - Authentication with specific roles
