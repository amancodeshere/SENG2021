import { inputOrder } from '../../orderToDB.js';
import { db } from '../../connect.js';
import { CustomInputError } from '../../errors.js';

jest.mock('../connect.js', () => ({
    db: {
        get: jest.fn(),
        run: jest.fn(),
        exec: jest.fn(),
    }
}));

describe("inputOrder Function", () => {
    const validOrder = {
        SalesOrderID: "12345678",
        UUID: "550e8400-e29b-41d4-a716-446655440000",
        IssueDate: "2025-03-06",
        PartyName: "ABC Corp",
        PayableAmount: 500,
        PayableCurrencyCode: "USD",
        Items: [
            {
                ItemDescription: "Electronic Component",
                BuyersItemIdentification: "87654321",
                SellersItemIdentification: "12345678",
                ItemAmount: 10,
                ItemUnitCode: "PCS"
            }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
        db.get.mockImplementation((sql, params, callback) => callback(null, { count: 0 }));
    });

    //  Order ID already exists
    test("should return error when SalesOrderID already exists", (done) => {
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, { count: 1 }));

        inputOrder(
            ...Object.values(validOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe("SalesOrderID already exists.");
                expect(result).toBeUndefined();
                done();
            }
        );
    });

    //  Invalid UUID
    test("should return error for invalid UUID", (done) => {
        const invalidOrder = { ...validOrder, UUID: "invalid-uuid" };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe("Invalid UUID.");
                done();
            }
        );
    });

    //  Invalid Issue Date
    test("should return error for invalid Issue Date", (done) => {
        const invalidOrder = { ...validOrder, IssueDate: "invalid-date" };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe("Invalid Issue Date.");
                done();
            }
        );
    });

    //  Invalid Party Name
    test("should return error for invalid Party Name", (done) => {
        const invalidOrder = { ...validOrder, PartyName: "" };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe("Invalid Party Name.");
                done();
            }
        );
    });

    //  Invalid Payable Amount
    test("should return error for negative Payable Amount", (done) => {
        const invalidOrder = { ...validOrder, PayableAmount: -100 };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe("Invalid Payable Amount.");
                done();
            }
        );
    });

    //  Invalid Currency Code
    test("should return error for invalid Currency Code", (done) => {
        const invalidOrder = { ...validOrder, PayableCurrencyCode: "123" };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe("Invalid Payable Currency Code.");
                done();
            }
        );
    });

    //  Invalid Items Array
    test("should return error when Items array is empty", (done) => {
        const invalidOrder = { ...validOrder, Items: [] };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe("Invalid Items list.");
                done();
            }
        );
    });

    //  Invalid Item Data
    test("should return error when an Item has invalid data", (done) => {
        const invalidOrder = {
            ...validOrder,
            Items: [{ ItemDescription: "", BuyersItemIdentification: "123", SellersItemIdentification: "456", ItemAmount: -5, ItemUnitCode: "XYZ" }]
        };

        inputOrder(
            ...Object.values(invalidOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/Invalid Item Description|Invalid Buyers Item ID|Invalid Sellers Item ID|Invalid Item Amount|Invalid Item Unit Code/);
                done();
            }
        );
    });

    //  Database transaction fails
    test("should rollback transaction if order insertion fails", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => callback(new Error("Insert failed")));
        db.exec.mockImplementationOnce((sql, callback) => callback(null));

        inputOrder(
            ...Object.values(validOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe("Database error while inserting order: Insert failed");
                expect(db.exec).toHaveBeenCalledWith("ROLLBACK;", expect.any(Function));
                done();
            }
        );
    });

    //  Order & Items inserted successfully
    test("should insert order and items successfully", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => callback(null));
        db.exec.mockImplementationOnce((sql, callback) => callback(null));

        inputOrder(
            ...Object.values(validOrder),
            (err, result) => {
                expect(err).toBeNull();
                expect(result).toEqual({ success: true, message: "Order and items inserted successfully." });
                expect(db.exec).toHaveBeenCalledWith("COMMIT;", expect.any(Function));
                done();
            }
        );
    });

    //  Transaction rollback if commit fails
    test("should rollback transaction if commit fails", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => callback(null));
        db.exec.mockImplementationOnce((sql, callback) => callback(new Error("Commit failed")));
        db.exec.mockImplementationOnce((sql, callback) => callback(null));

        inputOrder(
            ...Object.values(validOrder),
            (err, result) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toBe("Error committing order transaction.");
                expect(db.exec).toHaveBeenCalledWith("ROLLBACK;", expect.any(Function));
                done();
            }
        );
    });
});
