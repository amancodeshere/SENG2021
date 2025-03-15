import { getInvoicesByCompanyName } from "../../invoiceToDB.js";
import { db } from "../../connect.js";
import { CustomInputError } from "../../errors.js";

jest.mock("../../connect.js", () => ({
    db: {
        all: jest.fn(),
    },
}));

describe("getInvoicesByCompanyName Function", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return invoices when company has invoices", (done) => {
        const mockInvoices = [
            {
                InvoiceID: 1,
                IssueDate: "2025-03-06",
                PartyNameBuyer: "ABC Corp",
                PayableAmount: 500,
                CurrencyCode: "USD",
                SalesOrderID: "12345678"
            }
        ];

        db.all.mockImplementation((sql, params, callback) => callback(null, mockInvoices));

        getInvoicesByCompanyName("ABC Corp", (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual(mockInvoices);
            expect(db.all).toHaveBeenCalledTimes(1);
            expect(db.all).toHaveBeenCalledWith(
                expect.stringContaining("SELECT * FROM invoices"),
                ["ABC Corp"],
                expect.any(Function)
            );
            done();
        });
    });

    test("should return error when no invoices are found", (done) => {
        db.all.mockImplementation((sql, params, callback) => callback(null, []));

        getInvoicesByCompanyName("XYZ Ltd", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("No invoices found for this company.");
            expect(result).toBeUndefined();
            expect(db.all).toHaveBeenCalledTimes(1);
            expect(db.all).toHaveBeenCalledWith(
                expect.stringContaining("SELECT * FROM invoices"),
                ["XYZ Ltd"],
                expect.any(Function)
            );
            done();
        });
    });

    test("should return database error if query fails", (done) => {
        db.all.mockImplementation((sql, params, callback) => callback(new Error("Database failure")));

        getInvoicesByCompanyName("ABC Corp", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while fetching invoices.");
            expect(result).toBeUndefined();
            expect(db.all).toHaveBeenCalledTimes(1);
            done();
        });
    });
});
