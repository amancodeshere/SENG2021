import { getOrderIdsByPartyName } from '../databaseFunctions.js';
import { db } from '../connect.js';
import { CustomInputError } from '../errors.js';

jest.mock('../connect.js', () => ({
    db: {
        all: jest.fn(),
    }
}));

describe("getOrderIdsByPartyName Function", () => {
    const mockOrderIds = [{ SalesOrderID: "12345678" }, { SalesOrderID: "98765432" }];

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return order IDs when PartyName exists", (done) => {
        db.all.mockImplementation((sql, params, callback) => callback(null, mockOrderIds));

        getOrderIdsByPartyName("ABC Corp", (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual(["12345678", "98765432"]);
            expect(db.all).toHaveBeenCalledTimes(1);
            expect(db.all).toHaveBeenCalledWith(
                "SELECT SalesOrderID FROM orders WHERE PartyName = ?;",
                ["ABC Corp"],
                expect.any(Function)
            );
            done();
        });
    });

    test("should return error when no orders exist for the PartyName", (done) => {
        db.all.mockImplementation((sql, params, callback) => callback(null, []));

        getOrderIdsByPartyName("Nonexistent Corp", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("No orders found for this Party Name.");
            expect(result).toBeUndefined();
            expect(db.all).toHaveBeenCalledTimes(1);
            done();
        });
    });

    test("should return database error", (done) => {
        db.all.mockImplementation((sql, params, callback) => callback(new Error("Database failure")));

        getOrderIdsByPartyName("ABC Corp", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while fetching order IDs.");
            expect(result).toBeUndefined();
            expect(db.all).toHaveBeenCalledTimes(1);
            done();
        });
    });

});
