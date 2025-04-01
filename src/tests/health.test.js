import { healthCheck } from '../health.js';
import { db } from '../connect.js';

jest.mock('../connect.js', () => ({
    db: {
        query: jest.fn(),
    },
}));

describe("healthCheck Function", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("success should be returned if database is connected", async () => {
        db.query.mockResolvedValueOnce({}); // simulate a successful query

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await healthCheck({}, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                database: "connected",
                memoryUsage: expect.any(String),
                status: "success",
                Uptime: expect.any(String),
            })
        );
    });

    test("fail should be returned if database is not connected", async () => {
        db.query.mockRejectedValueOnce(new Error("Database connection failed"));

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await healthCheck({}, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: "fail",
            errorMessage: "Database is not connected",
        });
    });
});
