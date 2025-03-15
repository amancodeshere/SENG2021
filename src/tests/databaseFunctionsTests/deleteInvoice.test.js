import { deleteInvoiceById } from "../../invoiceToDB.js";
import { db } from "../../connect.js";
import { CustomInputError } from "../../errors.js";

jest.mock("../../connect.js", () => ({
    db: {
        exec: jest.fn(),
        run: jest.fn(),
    },
}));

describe("deleteInvoiceById Function", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should delete invoice and its items successfully", (done) => {
        db.exec.mockImplementation((sql, callback) => callback(null)); // Simulate successful transaction start and commit
        db.run.mockImplementation((sql, params, callback) => {
            if (sql.includes("DELETE FROM invoice_items")) {
                callback(null); // Simulating successful delete of invoice items
            } else if (sql.includes("DELETE FROM invoices")) {
                callback.call({ changes: 1 }, null); // Simulating successful invoice deletion
            }
        });

        deleteInvoiceById("10", (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({
                success: true,
                message: "Invoice and related items deleted successfully."
            });
            expect(db.exec).toHaveBeenCalledTimes(2); // Transaction start + commit
            expect(db.run).toHaveBeenCalledTimes(2); // Invoice items deletion + Invoice deletion
            done();
        });
    });

    test("should return error when transaction start fails", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(new Error("Transaction error")));

        deleteInvoiceById("5", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Error starting delete transaction.");
            expect(result).toBeUndefined();
            expect(db.exec).toHaveBeenCalledTimes(1);
            done();
        });
    });

    test("should return error when invoice not found", (done) => {
        db.exec.mockImplementation((sql, callback) => callback(null)); // Transaction start
        db.run.mockImplementation((sql, params, callback) => {
            if (sql.includes("DELETE FROM invoice_items")) {
                callback(null); // Simulating successful delete of invoice items
            } else if (sql.includes("DELETE FROM invoices")) {
                callback.call({ changes: 0 }, null); // Simulating no invoice deleted
            }
        });

        deleteInvoiceById("99", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Invoice not found.");
            expect(result).toBeUndefined();
            expect(db.exec).toHaveBeenCalledTimes(2);
            expect(db.run).toHaveBeenCalledTimes(2);
            done();
        });
    });

    test("should return database error when invoice deletion fails", (done) => {
        db.exec.mockImplementation((sql, callback) => callback(null)); // Transaction start
        db.run.mockImplementation((sql, params, callback) => {
            if (sql.includes("DELETE FROM invoice_items")) {
                callback(null); // Simulating successful delete of invoice items
            } else if (sql.includes("DELETE FROM invoices")) {
                callback(new Error("Database error while deleting invoice")); // Simulate failure
            }
        });

        deleteInvoiceById("7", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while deleting invoice.");
            expect(result).toBeUndefined();
            expect(db.exec).toHaveBeenCalledTimes(2);
            expect(db.run).toHaveBeenCalledTimes(2);
            done();
        });
    });
});
