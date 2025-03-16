import { healthCheck } from '../health.js';
import { db } from '../connect.js';

jest.mock('../connect.js', () => ({
    db: {
        get: jest.fn(),
    },
}));

describe("healthCheck Function", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("success should be returned if database is connected", (done) => {
        db.get.mockImplementation((sql, params, callback) => callback(null));

        healthCheck({}, {
            status: (statusCode) => {
                expect(statusCode).toBe(200);
                return {
                    json: (response) => {
                        expect(response.status).toBe("success");
                        expect(response.database).toBe("connected");
                        expect(response.Uptime).toBeDefined();
                        expect(response.memoryUsage).toBeDefined();
                        done();
                    }
                };
            }
        });

        expect(db.get).toHaveBeenCalledTimes(1);
    });

    test("fail should be returned if database is not connected", (done) => {
        db.get.mockImplementation((sql, params, callback) => callback(new Error("Database connection failed")));

        healthCheck({}, {
            status: (statusCode) => {
                expect(statusCode).toBe(500);
                return {
                    json: (response) => {
                        expect(response.status).toBe("fail");
                        expect(response.errorMessage).toBe("Database is not connected");
                        done();
                    }
                };
            }
        });

        expect(db.get).toHaveBeenCalledTimes(1);
    });

});
