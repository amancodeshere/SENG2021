import { updateUserSession } from '../../UsersToDB.js';
import { db } from '../../connect.js';

jest.mock('../../connect.js', () => ({
    db: {
        get: jest.fn(),
        run: jest.fn()
    }
}));

describe("updateUserSession Function - Session Management", () => {
    const userId = 1;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should initialize a new session if the user has no session", (done) => {
        db.get.mockImplementation((sql, params, callback) => callback(null, null)); // No session found
        db.run.mockImplementation((sql, params, callback) => callback(null)); // Insert success

        updateUserSession(userId, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ success: true, message: "Session initialized." });

            expect(db.get).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledWith(expect.stringMatching(/INSERT INTO sessions/), [userId], expect.any(Function));

            done();
        });
    });

    test("should increment session count if the user already has a session", (done) => {
        db.get.mockImplementation((sql, params, callback) => callback(null, { NumLogins: 2 })); // Session found
        db.run.mockImplementation((sql, params, callback) => callback(null)); // Update success

        updateUserSession(userId, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ success: true, message: "Session updated successfully." });

            expect(db.get).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledWith(expect.stringMatching(/UPDATE sessions/), [userId], expect.any(Function));

            done();
        });
    });

    test("should return error if database fails when checking session", (done) => {
        db.get.mockImplementation((sql, params, callback) => callback(new Error("Database error")));

        updateUserSession(userId, (err, result) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe("Database error while checking session.");
            expect(result).toBeUndefined();

            expect(db.get).toHaveBeenCalledTimes(1);
            expect(db.run).not.toHaveBeenCalled();

            done();
        });
    });

    test("should return error if database fails when creating session", (done) => {
        db.get.mockImplementation((sql, params, callback) => callback(null, null)); // No session found
        db.run.mockImplementation((sql, params, callback) => callback(new Error("Insert failed"))); // Insert fails

        updateUserSession(userId, (err, result) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe("Database error while creating session.");
            expect(result).toBeUndefined();

            expect(db.get).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledTimes(1);
            done();
        });
    });

    test("should return error if database fails when updating session", (done) => {
        db.get.mockImplementation((sql, params, callback) => callback(null, { NumLogins: 2 })); // Session found
        db.run.mockImplementation((sql, params, callback) => callback(new Error("Update failed"))); // Update fails

        updateUserSession(userId, (err, result) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe("Database error while updating session.");
            expect(result).toBeUndefined();

            expect(db.get).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledTimes(1);
            done();
        });
    });

    test("should return error if userId is not provided", (done) => {
        updateUserSession(null, (err, result) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe("User ID is required.");
            expect(result).toBeUndefined();
            done();
        });
    });
});
