import { db } from './connect.js';
import { CustomInputError } from './errors.js';
import { validate as validateUUID } from "uuid";
import { parse, isValid, format } from "date-fns";

// ===========================================================================
// ======================== Helper Functions Below ===========================
// ===========================================================================

/**
 * Validates a date string in 'YYYY-MM-DD'.
 *
 * @param {string} date - date string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidIssueDate(date) {
    if (typeof date !== 'string') return false;
    const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
    return isValid(parsedDate) && format(parsedDate, 'yyyy-MM-dd') === date;
}

/**
 * Validates a party name.
 *
 * @param {string} partyName - party name to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidPartyName(partyName) {
    if (typeof partyName !== 'string' || !partyName.trim()) {
        return false;
    }
    const allowedRegex = /^[a-zA-Z0-9\s.,'\-&()]+$/;
    return allowedRegex.test(partyName.trim());
}

/**
 * Validates a currency code.
 *
 * @param {string} currencyCode - currency code to validate.
 * @returns {boolean} true if valid, false otherwise.
 */
function isValidCurrencyCode(currencyCode) {
    return typeof currencyCode === 'string' && /^[A-Z]{3}$/.test(currencyCode);
}

/**
 * Validates a unit code.
 *
 * @param {string} unitCode - unit code to validate.
 * @returns {boolean} true if valid, false otherwise.
 */
function isValidUnitCode(unitCode) {
    return typeof unitCode === 'string' && /^[A-Z]{2,3}$/.test(unitCode);
}

/**
 * Validates an item identification number.
 *
 * @param {string|number} itemID - item ID to validate.
 * @returns {boolean} true if valid, false otherwise.
 */
function isValidItemID(itemID) {
    return typeof itemID === 'string' && /^\d{8}$/.test(itemID);
}

// ===========================================================================
// ======================== Helper Functions Above ===========================
// ===========================================================================

/**
 * Inserts an order into the database after performing input validation.
 *
 * @param {string} SalesOrderID - identifier for sales order.
 * @param {string} UUID - identifier the order
 * @param {string} IssueDate - issue date of order.
 * @param {string} PartyName - party name placing order
 * @param {number} PayableAmount - amount payable for order
 * @param {string} PayableCurrencyCode - currency code of payable amount
 * @param {string} ItemDescription - description of item.
 * @param {string|number} BuyersItemIdentification - buyers item id number
 * @param {string|number} SellersItemIdentification - sellers item id number.
 * @param {number} ItemAmount - quantity of item
 * @param {string} ItemUnitCode - unit code for item.
 * @param {function} callback - callback function to handle the result
 */
export function inputOrder(SalesOrderID, UUID, IssueDate, PartyName,
                           PayableAmount, PayableCurrencyCode, ItemDescription,
                           BuyersItemIdentification, SellersItemIdentification,
                           ItemAmount, ItemUnitCode, callback) {

    db.get('SELECT COUNT(*) AS count FROM orders WHERE SalesOrderID = ?', [SalesOrderID], (err, row) => {
        if (err) {
            console.error("SQL Error while checking SalesOrderID:", err.message);
            return callback(new CustomInputError('Database error while checking SalesOrderID.'));
        }
        if (row.count > 0) {
            return callback(new CustomInputError('SalesOrderID already exists.'));
        }

        // input validations
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

        if (typeof ItemAmount !== 'number' || ItemAmount < 0) {
            return callback(new CustomInputError('Invalid Item Amount.'));
        }

        if (!isValidUnitCode(ItemUnitCode)) {
            return callback(new CustomInputError('Invalid Item Unit Code.'));
        }

        if (!isValidItemID(SellersItemIdentification)) {
            return callback(new CustomInputError('Invalid Sellers Item ID.'));
        }

        if (!isValidItemID(BuyersItemIdentification)) {
            return callback(new CustomInputError('Invalid Buyers Item ID.'));
        }

        if (typeof ItemDescription !== 'string' || !ItemDescription.trim()) {
            return callback(new CustomInputError('Invalid Item Description.'));
        }


        db.exec("BEGIN TRANSACTION;", (beginErr) => {
            if (beginErr) {
                console.error("Error starting transaction:", beginErr.message);
                return callback(new CustomInputError('Error starting transaction.'));
            }

            const sqlStatement2 = `
                INSERT INTO orders (SalesOrderID, UUID, IssueDate, PartyName,
                                    PayableAmount, PayableCurrencyCode, ItemDescription,
                                    BuyersItemIdentification, SellersItemIdentification,
                                    ItemAmount, ItemUnitCode)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;

            db.run(sqlStatement2, [SalesOrderID, UUID, IssueDate, PartyName, PayableAmount, PayableCurrencyCode,
                ItemDescription, BuyersItemIdentification, SellersItemIdentification, ItemAmount, ItemUnitCode], function (err) {
                if (err) {
                    console.error('SQL Error while inserting order:', err.message);
                    db.exec("ROLLBACK;", () => {}); // Rollback if insertion fails
                    return callback(new CustomInputError(`Database error while inserting order: ${err.message}`));
                }

                db.exec("COMMIT;", (commitErr) => {
                    if (commitErr) {
                        console.error("Error committing transaction:", commitErr.message);
                        db.exec("ROLLBACK;", () => {}); // Rollback if commit fails
                        return callback(new CustomInputError('Error committing order transaction.'));
                    }
                    callback(null, { success: true, message: 'Order inserted successfully.' });
                });
            });
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
