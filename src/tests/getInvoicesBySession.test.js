import { getInvoicesBySession } from '../invoice.js';
import { db } from '../connect.js';
import { CustomInputError } from '../errors.js';

jest.mock('../connect.js', () => {
    const mockDb = {
        get: jest.fn(),
        all: jest.fn(),
    };
    return { db: mockDb };
});

describe("getInvoicesBySession Function - Fetching Invoices", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should return an error if sessionId is invalid", (done) => {
        getInvoicesBySession(null, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Invalid session ID.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should return an error if session does not exist", (done) => {
        db.get.mockImplementationOnce((sql, params, callback) => {
            callback(null, null); // no session
        });

        getInvoicesBySession(12345, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Invalid session. No user found.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should return an error if fetching session details fails", (done) => {
        db.get.mockImplementationOnce((sql, params, callback) => {
            callback(new Error("DB Error"), null);
        });

        getInvoicesBySession(12345, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while fetching session.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should return an error if user does not belong to a valid company", (done) => {
        db.get
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { UserID: 1 }); // session found
            })
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, null); // no company found
            });

        getInvoicesBySession(12345, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("User does not belong to a valid company.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should return an error if company invoices are not found", (done) => {
        db.get
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { UserID: 1 }); // session found
            })
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { CompanyName: "TechCorp" }); // company found
            });

        db.all.mockImplementationOnce((sql, params, callback) => {
            callback(null, []); // no invoices found
        });

        getInvoicesBySession(12345, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("No invoices found for this company.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should return an error if fetching invoices fails", (done) => {
        db.get
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { UserID: 1 }); // session found
            })
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { CompanyName: "TechCorp" }); // company found
            });

        db.all.mockImplementationOnce((sql, params, callback) => {
            callback(new Error("DB Error"), null);
        });

        getInvoicesBySession(12345, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while fetching invoices.");
            expect(result).toBeUndefined();
            done();
        });
    });

    test("should return a list of invoices successfully", (done) => {
        const mockInvoices = [
            { InvoiceID: 1, PartyNameBuyer: "TechCorp", PayableAmount: 500, CurrencyCode: "USD" },
            { InvoiceID: 2, PartyNameBuyer: "TechCorp", PayableAmount: 300, CurrencyCode: "EUR" }
        ];

        db.get
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { UserID: 1 }); // session found
            })
            .mockImplementationOnce((sql, params, callback) => {
                callback(null, { CompanyName: "TechCorp" }); // company found
            });

        db.all.mockImplementationOnce((sql, params, callback) => {
            callback(null, mockInvoices);
        });

        getInvoicesBySession(12345, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ companyName: "TechCorp", invoices: mockInvoices });
            done();
        });
    });
});