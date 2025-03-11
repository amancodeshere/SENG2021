import { deleteOrderById } from '../../orderToDB.js';
import { db } from '../../connect.js';
import { CustomInputError } from '../../errors.js';

jest.mock('../connect.js', () => ({
    db: {
        exec: jest.fn(),
        run: jest.fn(),
    }
}));

describe("deleteOrderById Function - Comprehensive Tests", () => {
    const mockOrderId = "12345678";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should delete order and its associated items successfully", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => {
            callback.call({ changes: 1 }, null);
        });
        db.exec.mockImplementationOnce((sql, callback) => callback(null));

        deleteOrderById(mockOrderId, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ success: true, message: "Order and related items deleted successfully." });

            expect(db.exec).toHaveBeenCalledTimes(2);
            expect(db.run).toHaveBeenCalledTimes(2);

            done();
        });
    });

    test("should return 'Order not found.' when SalesOrderID does not exist", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => {
            callback.call({ changes: 0 }, null);
        });
        db.exec.mockImplementationOnce((sql, callback) => callback(null));

        deleteOrderById(mockOrderId, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Order not found.");
            expect(result).toBeUndefined();

            expect(db.exec).toHaveBeenCalledTimes(2);
            expect(db.run).toHaveBeenCalledTimes(2);

            done();
        });
    });

    test("should rollback transaction if deleting order items fails", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Error deleting order items"));
        });
        db.exec.mockImplementationOnce((sql, callback) => callback(null));

        deleteOrderById(mockOrderId, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while deleting order items.");
            expect(result).toBeUndefined();
            expect(db.exec).toHaveBeenCalledTimes(2);
            expect(db.run).toHaveBeenCalledTimes(1);
            done();
        });
    });

    test("should rollback transaction if deleting order fails", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => {
            callback(new Error("Error deleting order"));
        });
        db.exec.mockImplementationOnce((sql, callback) => callback(null));

        deleteOrderById(mockOrderId, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Database error while deleting order.");
            expect(result).toBeUndefined();
            expect(db.exec).toHaveBeenCalledTimes(2);
            expect(db.run).toHaveBeenCalledTimes(2);
            done();
        });
    });

    test("should rollback transaction if commit fails", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => callback(null));
        db.run.mockImplementationOnce((sql, params, callback) => {
            callback.call({ changes: 1 }, null);
        });
        db.exec.mockImplementationOnce((sql, callback) => callback(new Error("Commit failed")));
        db.exec.mockImplementationOnce((sql, callback) => callback(null));

        deleteOrderById(mockOrderId, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Error committing delete transaction.");
            expect(result).toBeUndefined();
            expect(db.exec).toHaveBeenCalledTimes(3);
            expect(db.run).toHaveBeenCalledTimes(2);
            done();
        });
    });

    test("should return 'Error starting transaction.' when transaction cannot begin", (done) => {
        db.exec.mockImplementationOnce((sql, callback) => callback(new Error("Transaction start error")));

        deleteOrderById(mockOrderId, (err, result) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toBe("Error starting transaction.");
            expect(result).toBeUndefined();
            expect(db.exec).toHaveBeenCalledTimes(1);
            done();
        });
    });
});
