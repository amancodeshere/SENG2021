import { db } from '../connect.js';
import request from 'supertest';
import { app } from '../app.js';

jest.mock('../connect.js', () => ({
    db: {
        query: jest.fn(),
    },
}));

describe("healthCheck Function", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // TODO: ** Fix this test before merging into main **
    test("success should be returned if database is connected", async () => {
        db.query.mockResolvedValueOnce({}); // simulate a successful query

        let res = await request(app).get('/api/health');
        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
            database: "connected",
            memoryUsage: expect.any(String),
            status: "success",
            uptime: expect.any(String),
        })
    });

    test("fail should be returned if database is not connected", async () => {
        db.query.mockRejectedValueOnce(new Error("Database connection failed"));

        let res = await request(app).get('/api/health');

        expect(res.status).toEqual(500);
        expect(res.body).toEqual({
            status: "fail",
            errorMessage: "Database is not connected",
        });
    });
});
