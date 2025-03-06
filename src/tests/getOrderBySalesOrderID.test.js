import { getOrderBySalesOrderID } from '../orderToDB.js';
import { db } from '../connect.js';
import { CustomInputError } from '../errors.js';

jest.mock('../connect.js', () => ({
    db: {
        get: jest.fn(),
    }
}));

describe("getOrderBySalesOrderID Function", () => {
    const mockOrder = {
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

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return order when SalesOrderID exists", (done) => {
        db.get.mockImplementation((sql, params, callback) => callback(null, mockOrder));

        getOrderBySalesOrderID("12345678", (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual(mockOrder);
            expect(db.get).toHaveBeenCalledTimes(1);
            expect(db.get).toHaveBeenCalledWith(
                "SELECT * FROM orders WHERE SalesOrderID = ?;",
                ["12345678"],
                expect.any(Function)
            );
            done();
        });
    });

    test("should return error when SalesOrderID does not exist", (done) => {
        db.get.mockImplementation((sql, params, callback) => callback(null, null)); // No order found

        getOrderBySalesOrderID("87654321", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Order not found.");
            expect(result).toBeUndefined();
            expect(db.get).toHaveBeenCalledTimes(1);
            done();
        });
    });

    test("should return database error", (done) => {
        db.get.mockImplementation((sql, params, callback) => callback(new Error("Database failure")));

        getOrderBySalesOrderID("12345678", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while fetching order.");
            expect(result).toBeUndefined();
            expect(db.get).toHaveBeenCalledTimes(1);
            done();
        });
    });

});
