import { inputInvoice } from "../invoiceToDB.js";
import { db } from "../connect.js";
import { CustomInputError } from "../errors.js";

jest.mock("../connect.js", () => ({
    db: {
        exec: jest.fn(),
        get: jest.fn(),
        run: jest.fn(),
        all: jest.fn(),
    },
}));

describe("inputInvoice Function - Database Operations", () => {
    const SalesOrderID = "12345678";
    const mockOrder = {
        IssueDate: "2025-03-06",
        PartyNameBuyer: "ABC Corp",
        PayableAmount: 500,
        CurrencyCode: "USD",
    };
    const mockItems = [
        {
            ItemDescription: "Electronic Component",
            BuyersItemIdentification: "87654321",
            SellersItemIdentification: "12345678",
            ItemAmount: 10,
            ItemUnitCode: "PCS",
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should create invoice successfully", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null)); // Begin transaction
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, mockOrder)); // Get order details
        db.run.mockImplementationOnce((sql, params, callback) => {
            db.lastID = 1; // Mock Invoice ID
            callback(null);
        });
        db.all.mockImplementationOnce((sql, params, callback) => callback(null, mockItems)); // Get order items
        db.run.mockImplementationOnce((sql, params, callback) => callback(null)); // Insert invoice item
        db.exec.mockImplementationOnce((sql, callback) => callback(null)); // Commit transaction

        inputInvoice(SalesOrderID, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({
                success: true,
                message: "Invoice created successfully.",
                InvoiceID: 1,
            });
            expect(db.exec).toHaveBeenCalledTimes(2); // Start & commit
            expect(db.get).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledTimes(2);
            expect(db.all).toHaveBeenCalledTimes(1);
            done();
        });
    });

    test("should return error when transaction start fails", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(new Error("Transaction error")));

        inputInvoice(SalesOrderID, (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Error starting invoice transaction.");
            done();
        });
    });

    test("should return error when order not found", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, null));

        inputInvoice(SalesOrderID, (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Order not found.");
            done();
        });
    });

    test("should return error when fetching order fails", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.get.mockImplementationOnce((sql, params, callback) => callback(new Error("DB fetch error")));

        inputInvoice(SalesOrderID, (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while fetching order.");
            done();
        });
    });

    test("should return error when inserting invoice fails", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, mockOrder));
        db.run.mockImplementationOnce((sql, params, callback) => callback(new Error("Insert invoice failed")));

        inputInvoice(SalesOrderID, (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while inserting invoice.");
            done();
        });
    });

    test("should return error when fetching order items fails", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, mockOrder));
        db.run.mockImplementationOnce((sql, params, callback) => {
            db.lastID = 1;
            callback(null);
        });
        db.all.mockImplementationOnce((sql, params, callback) => callback(new Error("DB fetch error")));

        inputInvoice(SalesOrderID, (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while fetching order items.");
            done();
        });
    });

    test("should return error when no items found for the order", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, mockOrder));
        db.run.mockImplementationOnce((sql, params, callback) => {
            db.lastID = 1;
            callback(null);
        });
        db.all.mockImplementationOnce((sql, params, callback) => callback(null, []));

        inputInvoice(SalesOrderID, (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("No items found for this order.");
            done();
        });
    });

    test("should return error when inserting invoice item fails", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, mockOrder));
        db.run.mockImplementationOnce((sql, params, callback) => {
            db.lastID = 1;
            callback(null);
        });
        db.all.mockImplementationOnce((sql, params, callback) => callback(null, mockItems));
        db.run.mockImplementationOnce((sql, params, callback) => callback(new Error("Insert invoice item failed")));

        inputInvoice(SalesOrderID, (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while inserting invoice items.");
            done();
        });
    });

    test("should return error when commit fails", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null)); // Begin transaction
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, mockOrder));
        db.run.mockImplementationOnce((sql, params, callback) => {
            db.lastID = 1;
            callback(null);
        });
        db.all.mockImplementationOnce((sql, params, callback) => callback(null, mockItems));
        db.run.mockImplementationOnce((sql, params, callback) => callback(null)); // Insert invoice item
        db.exec.mockImplementationOnce((sql, callback) => callback(new Error("Commit failed"))); // Commit fails

        inputInvoice(SalesOrderID, (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Error committing invoice transaction.");
            done();
        });
    });
});
