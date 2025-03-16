import { healthCheck } from './health.js';
import { db } from './connect.js';

jest.mock('./connect.js', () => ({
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

    test("Check to see if calcUptime and getMemoryUsage function are called", (done) => {
        jest.spyOn(healthCheck, 'calcUptime').mockReturnValue('1 hour(s), 30 minutes');
        jest.spyOn(healthCheck, 'getMemoryUsage').mockReturnValue('500MB');

        db.get.mockImplementation((sql, params, callback) => callback(null));

        healthCheck({}, {
            status: (statusCode) => {
                expect(statusCode).toBe(200);
                return {
                    json: (response) => {
                        expect(response.Uptime).toBe('1 hour(s), 30 minutes');
                        expect(response.memoryUsage).toBe('500MB');
                        done();
                    }
                };
            }
        });

        expect(db.get).toHaveBeenCalledTimes(1);
        expect(healthCheck.calcUptime).toHaveBeenCalledTimes(1);
        expect(healthCheck.getMemoryUsage).toHaveBeenCalledTimes(1);
    });
});
