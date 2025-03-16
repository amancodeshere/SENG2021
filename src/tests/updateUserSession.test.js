import { updateUserSession } from '../UsersToDB.js';
import { db } from '../connect.js';

jest.mock('../connect.js', () => ({
    db: {
        get: jest.fn(),
        run: jest.fn()
    }
}));

describe("updateUserSession Function - Session Management", () => {
    const validEmail = "testuser@example.com";
    const validUserID = 5;
    const newSessionID = 23;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should fail when email is missing", (done) => {
        updateUserSession(null, (err, result) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe("Email is required.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should fail when user is not found in the database", (done) => {
        db.get.mockImplementationOnce((sql, params, callback) => {
            callback(null, null); // no user found
        });

        updateUserSession(validEmail, (err, result) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe("User not found.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should fail when database error occurs while fetching user ID", (done) => {
        db.get.mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database fetch error"), null);
        });

        updateUserSession(validEmail, (err, result) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe("Database error while fetching user ID.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should fail when database error occurs while creating session", (done) => {
        db.get.mockImplementationOnce((sql, params, callback) => {
            callback(null, { UserID: validUserID });
        });

        db.run.mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Database insertion error"));
        });

        updateUserSession(validEmail, (err, result) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe("Database error while creating session.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should successfully create a new session and return session details", (done) => {
        db.get.mockImplementationOnce((sql, params, callback) => {
            callback(null, { UserID: validUserID });
        });

        db.run.mockImplementationOnce((sql, params, callback) => {
            callback.call({ lastID: newSessionID }, null); // session creation
        });

        updateUserSession(validEmail, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({
                success: true,
                message: "New session created.",
                userID: validUserID,
                sessionID: newSessionID
            });
            done();
        });
    });
});
