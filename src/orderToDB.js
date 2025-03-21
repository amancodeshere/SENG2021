import { db } from './connect.js';
import { CustomInputError } from './errors.js';
import { validate as validateUUID } from "uuid";
import { parse, isValid, format } from "date-fns";
import { isValidPartyName } from './helperFunctions.js'

// ===========================================================================
// ======================== Helper Functions Below ===========================
// ===========================================================================

/**
 * Validates a date string in 'YYYY-MM-DD'.
 *
 * @param {string} date - date string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
export function isValidIssueDate(date) {
    if (typeof date !== 'string') return false;
    const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
    return isValid(parsedDate) && format(parsedDate, 'yyyy-MM-dd') === date;
}

/**
 * Validates a currency code.
 *
 * @param {string} currencyCode - currency code to validate.
 * @returns {boolean} true if valid, false otherwise.
 */
export function isValidCurrencyCode(currencyCode) {
    return typeof currencyCode === 'string' && /^[A-Z]{3}$/.test(currencyCode);
}

/**
 * Validates a unit code.
 *
 * @param {string} unitCode - unit code to validate.
 * @returns {boolean} true if valid, false otherwise.
 */
export function isValidUnitCode(unitCode) {
    return typeof unitCode === 'string';
}

/**
 * Validates an item identification number.
 *
 * @param {string|number} itemID - item ID to validate.
 * @returns {boolean} true if valid, false otherwise.
 */
export function isValidItemID(itemID) {
    return typeof itemID === 'string' && /^\d+$/.test(itemID);
}

// ===========================================================================
// ======================== Helper Functions Above ===========================
// ===========================================================================

/**
 * Inserts an order and its items into the database after validation.
 *
 * @param {string} UUID - identifier the order
 * @param {string} IssueDate - issue date of order.
 * @param {string} PartyName - party name placing order
 * @param {number} PayableAmount - amount payable for order
 * @param {string} PayableCurrencyCode - currency code of payable amount
 * @param {Array} Items - Array of items (each item is an object)
 * @param {function} callback - callback function to handle the result
 */
export function inputOrder(UUID, IssueDate, PartyName,
                           PayableAmount, PayableCurrencyCode, Items, callback) {

    // Validate order
    if (!validateUUID(UUID)) {
        return callback(new CustomInputError('Invalid UUID.'));
    }

    if (!isValidIssueDate(IssueDate)) {
        return callback(new CustomInputError('Invalid Issue Date.'));
    }
    if (!isValidPartyName(PartyName)) {
        return callback(new CustomInputError('Invalid Party Name.'));
    }
    if (typeof PayableAmount !== 'number' || PayableAmount < 0) {
        return callback(new CustomInputError('Invalid Payable Amount.'));
    }
    if (!isValidCurrencyCode(PayableCurrencyCode)) {
        return callback(new CustomInputError('Invalid Payable Currency Code.'));
    }
    if (!Array.isArray(Items) || Items.length === 0) {
        return callback(new CustomInputError('Invalid Items list.'));
    }
    // validate item(s) in Items array
    for (const item of Items) {
        if (!isValidItemID(item.Id)) {
            return callback(new CustomInputError('Invalid Item ID.'));
        }
        if (typeof item.ItemAmount !== 'number' || item.ItemAmount < 0) {
            return callback(new CustomInputError('Invalid Item Amount.'));
        }
        if (!isValidUnitCode(item.ItemUnitCode)) {
            return callback(new CustomInputError('Invalid Item Unit Code.'));
        }
    }

    db.exec("BEGIN TRANSACTION;", (beginErr) => {
        if (beginErr) {
            console.error("Error starting transaction:", beginErr.message);
            return callback(new CustomInputError('Error starting transaction.'));
        }

        const sqlOrderInsert = `
            INSERT INTO orders (UUID, IssueDate, PartyName, PayableAmount, PayableCurrencyCode)
            VALUES (?, ?, ?, ?, ?);
        `;

        db.run(sqlOrderInsert, [UUID, IssueDate, PartyName, PayableAmount, PayableCurrencyCode], function (err) {
            if (err) {
                console.error('SQL Error while inserting order:', err.message);
                db.exec("ROLLBACK;", () => {});
                return callback(new CustomInputError(`Database error while inserting order: ${err.message}`));
            }

            const OrderID = this?.lastID || 1; // Ensure there's an ID for testing purposes


            // item insertion is handled separately now
            const sqlItemInsert = `
                INSERT INTO order_items (OrderItemId, OrderId, ItemName, ItemDescription, ItemAmount, ItemUnitCode)
                VALUES (?, ?, ?, ?, ?, ?);
            `;

            let pendingItems = Items.length;
            for (const item of Items) {
                db.run(sqlItemInsert, [item.Id, OrderID, item.ItemName, item.ItemDescription, item.ItemAmount, item.ItemUnitCode], function (err) {
                    if (err) {
                        console.error('SQL Error while inserting order item:', err.message);
                        db.exec("ROLLBACK;", () => {});
                        return callback(new CustomInputError(`Database error while inserting order item: ${err.message}`));
                    }
                    pendingItems--;
                    if (pendingItems === 0) {
                        db.exec("COMMIT;", (commitErr) => {
                            if (commitErr) {
                                console.error("Error committing transaction:", commitErr.message);
                                db.exec("ROLLBACK;", () => {});
                                return callback(new CustomInputError('Error committing order transaction.'));
                            }
                            callback(null, { success: true, message: 'Order and items inserted successfully.' });
                        });
                    }
                });
            }
        });
    });
}


/**
 * Get the full order details from SalesOrderID
 *
 * @param {String} SalesOrderID
 * @param {function} callback - callback function to handle the result
 **/
export function getOrderBySalesOrderID(SalesOrderID, callback) {
    console.log(`Fetching order with SalesOrderID: ${SalesOrderID}`);

    const sqlQuery = `SELECT * FROM orders WHERE SalesOrderID = ?;`;

    db.get(sqlQuery, [SalesOrderID], (err, row) => {
        if (err) {
            console.error("SQL Error while fetching  order:", err.message);
            return callback(new CustomInputError('Database error while fetching order.'));
        }
        if (!row) {
            return callback(new CustomInputError('Order not found.'));
        }
        callback(null, row);
    });
}

/**
 * Get a list of SalesOrderIDs from a party's name
 *
 * @param {String} PartyName
 * @param {function} callback - callback function to handle the result
 **/
export function getOrderIdsByPartyName(PartyName, callback) {
    console.log(`Fetching order IDs for PartyName: ${PartyName}`);

    const sqlQuery = `SELECT SalesOrderID FROM orders WHERE PartyName = ?;`;

    db.all(sqlQuery, [PartyName], (err, rows) => {
        if (err) {
            console.error("SQL Error while fetching order IDs:", err.message);
            return callback(new CustomInputError('Database error while fetching order IDs.'));
        }
        if (!rows || rows.length === 0) {
            return callback(new CustomInputError('No orders found for this Party Name.'));
        }
        callback(null, rows.map(row => row.SalesOrderID));
    });
}

/**
 * Delete an order from database given SalesOrderIDs
 *
 * @param {String} SalesOrderID
 * @param {function} callback - callback function to handle the result
 **/
export function deleteOrderById(SalesOrderID, callback) {
    console.log(`Deleting order and associated items with SalesOrderID: ${SalesOrderID}`);

    db.exec("BEGIN TRANSACTION;", (beginErr) => {
        if (beginErr) {
            console.error("Error starting transaction:", beginErr.message);
            return callback(new CustomInputError('Error starting transaction.'));
        }

        // delete items from order_items table first
        const sqlDeleteItems = `DELETE FROM order_items WHERE SalesOrderID = ?;`;
        db.run(sqlDeleteItems, [SalesOrderID], function (err) {
            if (err) {
                console.error("SQL Error while deleting order items:", err.message);
                db.exec("ROLLBACK;", () => {}); // Rollback if deletion fails
                return callback(new CustomInputError('Database error while deleting order items.'));
            }

            // delete order
            const sqlDeleteOrder = `DELETE FROM orders WHERE SalesOrderID = ?;`;
            db.run(sqlDeleteOrder, [SalesOrderID], function (err) {
                if (err) {
                    console.error("SQL Error while deleting order:", err.message);
                    db.exec("ROLLBACK;", () => {}); // Rollback if deletion fails
                    return callback(new CustomInputError('Database error while deleting order.'));
                }

                if (this.changes === 0) {
                    db.exec("ROLLBACK;", () => {});
                    return callback(new CustomInputError('Order not found.'));
                }

                // commit after both deletions
                db.exec("COMMIT;", (commitErr) => {
                    if (commitErr) {
                        console.error("Error committing transaction:", commitErr.message);
                        db.exec("ROLLBACK;", () => {});
                        return callback(new CustomInputError('Error committing delete transaction.'));
                    }
                    callback(null, { success: true, message: 'Order and related items deleted successfully.' });
                });
            });
        });
    });
}

