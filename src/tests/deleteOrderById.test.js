import { deleteOrderById } from '../orderToDB.js';
import { db } from '../connect.js';
import { CustomInputError } from '../errors.js';

jest.mock('../connect.js', () => ({
    db: {
        run: jest.fn(),
    }
}));

describe("deleteOrderById Function - Error Cases", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return 'Order not found.' when SalesOrderID does not exist", (done) => {
        db.run.mockImplementation((sql, params, callback) => {
            callback.call({ changes: 0 }, null); // Simulating no rows deleted
        });

        deleteOrderById("87654321", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Order not found.");
            expect(result).toBeUndefined();
            expect(db.run).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledWith(
                "DELETE FROM orders WHERE SalesOrderID = ?;",
                ["87654321"],
                expect.any(Function)
            );
            done();
        });
    });

    test("should return 'Database error while deleting order.' when database error occurs", (done) => {
        db.run.mockImplementation((sql, params, callback) => {
            callback(new Error("Database failure")); // Simulating a database error
        });

        deleteOrderById("12345678", (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while deleting order.");
            expect(result).toBeUndefined();
            expect(db.run).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledWith(
                "DELETE FROM orders WHERE SalesOrderID = ?;",
                ["12345678"],
                expect.any(Function)
            );
            done();
        });
    });
});
