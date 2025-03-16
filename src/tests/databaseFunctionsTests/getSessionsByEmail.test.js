jest.mock("../../connect.js", () => ({
    db: {
        get: jest.fn(),
        all: jest.fn(),
    }
}));

import { getSessionsByEmail } from "../../UsersToDB.js";
import { db } from "../../connect.js";
import { CustomInputError } from "../../errors.js";

describe("getSessionsByEmail Function", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return sessions for a valid email", (done) => {
        db.get.mockImplementation((sql, params, callback) => {
            callback(null, { UserID: 1 }); // userID found
        });

        db.all.mockImplementation((sql, params, callback) => {
            callback(null, [{ SessionID: 123, CreatedAt: "2025-01-01" }]); // sessions found
        });

        getSessionsByEmail("test@example.com", (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({
                userID: 1,
                sessions: [{ SessionID: 123, CreatedAt: "2025-01-01" }]
            });
            expect(db.get).toHaveBeenCalledTimes(1);
            expect(db.all).toHaveBeenCalledTimes(1);
            done();
        });
    });

    test("should return error when user is not found", (done) => {
        db.get.mockImplementation((sql, params, callback) => {
            callback(null, null); // no user found
        });

        getSessionsByEmail("notfound@example.com", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("User not found.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should return error when database fails on user fetch", (done) => {
        db.get.mockImplementation((sql, params, callback) => {
            callback(new Error("Database failure"), null);
        });

        getSessionsByEmail("test@example.com", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while fetching user.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should return error when database fails on session fetch", (done) => {
        db.get.mockImplementation((sql, params, callback) => {
            callback(null, { UserID: 1 }); // userID found
        });

        db.all.mockImplementation((sql, params, callback) => {
            callback(new Error("Database failure"), null);
        });

        getSessionsByEmail("test@example.com", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while fetching sessions.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should return error when no sessions are found", (done) => {
        db.get.mockImplementation((sql, params, callback) => {
            callback(null, { UserID: 1 }); // Simulating UserID found
        });

        db.all.mockImplementation((sql, params, callback) => {
            callback(null, []);
        });

        getSessionsByEmail("test@example.com", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("No sessions found for this user.");
            expect(result).toBeUndefined();
            done();
        });
    });
});
