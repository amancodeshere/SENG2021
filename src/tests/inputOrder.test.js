import { inputOrder } from '../orderToDB.js';
import { db } from '../connect.js';
import { CustomInputError } from '../errors.js';

jest.mock('../connect.js', () => ({
    db: {
        get: jest.fn(),
        run: jest.fn(),
        exec: jest.fn(),
    }
}));

describe("inputOrder Function - Input Validations", () => {
    const validOrder = {
        SalesOrderID: "12345678",
        UUID: "550e8400-e29b-41d4-a716-446655440000",
        IssueDate: "2025-03-06",
        PartyName: "ABC Corp",
        PayableAmount: 500,
        PayableCurrencyCode: "USD",
        ItemDescription: "Electronic Component",
        BuyersItemIdentification: "87654321",
        SellersItemIdentification: "12345678",
        ItemAmount: 10,
        ItemUnitCode: "PCS"
    };

    beforeEach(() => {
        jest.clearAllMocks();
        db.get.mockImplementation((sql, params, callback) => callback(null, { count: 0 })); // Mock SalesOrderID does NOT exist
    });

    test("should fail when UUID is invalid", (done) => {
        const invalidOrder = { ...validOrder, UUID: "invalid-uuid" };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Invalid UUID.');
                done();
            }
        );
    });

    test("should fail when UUID is missing", (done) => {
        const invalidOrder = { ...validOrder, UUID: null };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Invalid UUID.');
                done();
            }
        );
    });

    test("should fail when IssueDate is invalid", (done) => {
        const invalidOrder = { ...validOrder, IssueDate: "invalid-date" };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Invalid Issue Date.');
                done();
            }
        );
    });

    test("should fail when PartyName is invalid", (done) => {
        const invalidOrder = { ...validOrder, PartyName: "" };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Invalid Party Name.');
                done();
            }
        );
    });

    test("should fail when PayableAmount is negative", (done) => {
        const invalidOrder = { ...validOrder, PayableAmount: -50 };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Invalid Payable Amount.');
                done();
            }
        );
    });

    test("should fail when PayableCurrencyCode is invalid", (done) => {
        const invalidOrder = { ...validOrder, PayableCurrencyCode: "123" };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Invalid Payable Currency Code.');
                done();
            }
        );
    });

    test("should fail when ItemAmount is negative", (done) => {
        const invalidOrder = { ...validOrder, ItemAmount: -5 };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Invalid Item Amount.');
                done();
            }
        );
    });

    test("should fail when ItemUnitCode is invalid", (done) => {
        const invalidOrder = { ...validOrder, ItemUnitCode: "INVALID" };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Invalid Item Unit Code.');
                done();
            }
        );
    });

    test("should fail when SellersItemIdentification is invalid", (done) => {
        const invalidOrder = { ...validOrder, SellersItemIdentification: "ABC123" };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Invalid Sellers Item ID.');
                done();
            }
        );
    });

    test("should fail when BuyersItemIdentification is invalid", (done) => {
        const invalidOrder = { ...validOrder, BuyersItemIdentification: "XYZ999" };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Invalid Buyers Item ID.');
                done();
            }
        );
    });

    test("should fail when ItemDescription is empty", (done) => {
        const invalidOrder = { ...validOrder, ItemDescription: "" };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Invalid Item Description.');
                done();
            }
        );
    });

    test("should fail when ItemDescription is not a string", (done) => {
        const invalidOrder = { ...validOrder, ItemDescription: 12345 };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Invalid Item Description.');
                done();
            }
        );
    });

    test("should rollback transaction if unexpected error occurs", (done) => {
        db.get.mockImplementation((sql, params, callback) => callback(null, { count: 0 })); // ID does not exist
        db.exec.mockImplementationOnce((sql, callback) => callback(null)); // Begin transaction
        db.run.mockImplementation((sql, params, callback) => callback(null)); // Insert success
        db.exec.mockImplementationOnce((sql, callback) => callback(new Error("Unexpected error during commit"))); // Commit fails

        inputOrder(
            ...Object.values(validOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Error committing order transaction.');
                expect(db.exec).toHaveBeenCalledWith("ROLLBACK;", expect.any(Function)); // Ensure rollback was called
                done();
            }
        );
    });

    test("should rollback if error occurs after starting transaction", (done) => {
        db.get.mockImplementation((sql, params, callback) => callback(null, { count: 0 })); // ID does not exist
        db.exec.mockImplementationOnce((sql, callback) => callback(null)); // Begin transaction
        db.run.mockImplementation((sql, params, callback) => callback(new Error("Insert failed"))); // Insert fails

        inputOrder(
            ...Object.values(validOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Database error while inserting order: Insert failed');
                expect(db.exec).toHaveBeenCalledWith("ROLLBACK;", expect.any(Function)); // Ensure rollback occurs
                done();
            }
        );
    });

    test("should fail when database connection is lost", (done) => {
        db.get.mockImplementation((sql, params, callback) => callback(new Error("Lost connection to database")));

        inputOrder(
            ...Object.values(validOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe('Database error while checking SalesOrderID.');
                done();
            }
        );
    });
});
