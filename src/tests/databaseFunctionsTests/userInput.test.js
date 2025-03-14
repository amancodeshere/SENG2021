import { userInput } from '../UsersToDB.js';
import { db } from '../connect.js';
import { CustomInputError } from '../errors.js';
import bcrypt from 'bcrypt';

jest.mock('../../connect.js', () => ({
    db: {
        run: jest.fn(),
    }
}));

jest.mock('bcrypt');

describe("userInput Function - User Registration", () => {
    const validUser = {
        email: "testuser@example.com",
        password: "securepassword",
        company: "TechCorp"
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should fail when required fields are missing", (done) => {
        userInput(null, validUser.password, validUser.company, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Missing required fields.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should fail when bcrypt hashing fails", (done) => {
        bcrypt.hash.mockImplementation((password, saltRounds, callback) => {
            callback(new Error("Hashing failed"), null);
        });

        userInput(validUser.email, validUser.password, validUser.company, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Error processing password.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should fail when user insertion into database fails", (done) => {
        bcrypt.hash.mockImplementation((password, saltRounds, callback) => {
            callback(null, "hashedpassword");
        });

        db.run.mockImplementationOnce((sql, params, callback) => {
            callback(new Error("DB Insertion Failed"));
        });

        userInput(validUser.email, validUser.password, validUser.company, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while inserting user.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should fail when session initialization fails", (done) => {
        bcrypt.hash.mockImplementation((password, saltRounds, callback) => {
            callback(null, "hashedpassword");
        });

        db.run
            .mockImplementationOnce((sql, params, callback) => {
                callback.call({ lastID: 1 }, null); // Simulate successful user insertion
            })
            .mockImplementationOnce((sql, params, callback) => {
                callback(new Error("Session Initialization Failed"));
            });

        userInput(validUser.email, validUser.password, validUser.company, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while creating session.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should successfully register a user and initialize session", (done) => {
        bcrypt.hash.mockImplementation((password, saltRounds, callback) => {
            callback(null, "hashedpassword");
        });

        db.run
            .mockImplementationOnce((sql, params, callback) => {
                callback.call({ lastID: 1 }, null); // Simulate user insertion
            })
            .mockImplementationOnce((sql, params, callback) => {
                callback.call({ lastID: 100 }, null); // Simulate session insertion (SessionID = 100)
            });

        userInput(validUser.email, validUser.password, validUser.company, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({
                success: true,
                message: "User registered.",
                userID: 1,
                sessionID: 100
            });
            done();
        });
    });
});
