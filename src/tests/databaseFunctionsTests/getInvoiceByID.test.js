import { getInvoiceByID } from "../../invoiceToDB.js";
import { db } from "../../connect.js";
import { CustomInputError } from "../../errors.js";

jest.mock("../connect.js", () => ({
    db: {
        get: jest.fn(),
        all: jest.fn(),
    },
}));

describe("getInvoiceByID Function - Database Operations", () => {
    const InvoiceID = "1";
    const mockInvoice = {
        InvoiceID: 1,
        IssueDate: "2025-03-06",
        PartyNameBuyer: "ABC Corp",
        PayableAmount: 500,
        CurrencyCode: "USD",
        SalesOrderID: "12345678",
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

    test("should fetch invoice successfully", (done) => {
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, mockInvoice));
        db.all.mockImplementationOnce((sql, params, callback) => callback(null, mockItems));

        getInvoiceByID(InvoiceID, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ ...mockInvoice, Items: mockItems });
            expect(db.get).toHaveBeenCalledTimes(1);
            expect(db.all).toHaveBeenCalledTimes(1);
            done();
        });
    });

    test("should return error when invoice is not found", (done) => {
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, null));

        getInvoiceByID(InvoiceID, (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Invoice not found.");
            done();
        });
    });

    test("should return error when fetching invoice fails", (done) => {
        db.get.mockImplementationOnce((sql, params, callback) => callback(new Error("DB fetch error")));

        getInvoiceByID(InvoiceID, (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while fetching invoice.");
            done();
        });
    });

    test("should return error when fetching invoice items fails", (done) => {
        db.get.mockImplementationOnce((sql, params, callback) => callback(null, mockInvoice));
        db.all.mockImplementationOnce((sql, params, callback) => callback(new Error("DB fetch error")));

        getInvoiceByID(InvoiceID, (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while fetching invoice items.");
            done();
        });
    });
});
