import { db } from './connect.js';
import { CustomInputError } from './errors.js';
import { validate as validateUUID } from "uuid";
import { parse, isValid, format } from "date-fns";
import { isValidPartyName } from './helperFunctions.js';

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
    return typeof unitCode === 'string' && /^[A-Z]{2,3}$/.test(unitCode);
}

/**
 * Validates an item identification number.
 *
 * @param {string|number} itemID - item ID to validate.
 * @returns {boolean} true if valid, false otherwise.
 */
export function isValidItemID(itemID) {
    return typeof itemID === 'string' && /^\d{8}$/.test(itemID);
}

// ===========================================================================
// ======================== Helper Functions Above ===========================
// ===========================================================================

/**
 * Inserts an order and its items into the database after validation.
 *
 * @param {string} SalesOrderID - identifier for sales order.
 * @param {string} UUID - identifier the order
 * @param {string} IssueDate - issue date of order.
 * @param {string} PartyName - party name placing order
 * @param {number} PayableAmount - amount payable for order
 * @param {string} PayableCurrencyCode - currency code of payable amount
 * @param {Array} Items - Array of items (each item is an object)
 * @param {function} callback - callback function to handle the result
 */
export async function inputOrder(SalesOrderID, UUID, IssueDate, PartyName,
                                 PayableAmount, PayableCurrencyCode, Items, callback) {
    try {
        const checkRes = await db.query(`SELECT COUNT(*) FROM orders WHERE SalesOrderID = $1;`, [SalesOrderID]);
        if (parseInt(checkRes.rows[0].count) > 0) {
            return callback(new CustomInputError('SalesOrderID already exists.'));
        }

        // Validate order
        if (!validateUUID(UUID)) return callback(new CustomInputError('Invalid UUID.'));
        if (!isValidIssueDate(IssueDate)) return callback(new CustomInputError('Invalid Issue Date.'));
        if (!isValidPartyName(PartyName)) return callback(new CustomInputError('Invalid Party Name.'));
        if (typeof PayableAmount !== 'number' || PayableAmount < 0)
            return callback(new CustomInputError('Invalid Payable Amount.'));
        if (!isValidCurrencyCode(PayableCurrencyCode))
            return callback(new CustomInputError('Invalid Payable Currency Code.'));
        if (!Array.isArray(Items) || Items.length === 0)
            return callback(new CustomInputError('Invalid Items list.'));

        for (const item of Items) {
            if (!isValidItemID(item.SellersItemIdentification))
                return callback(new CustomInputError('Invalid Sellers Item ID.'));
            if (!isValidItemID(item.BuyersItemIdentification))
                return callback(new CustomInputError('Invalid Buyers Item ID.'));
            if (typeof item.ItemAmount !== 'number' || item.ItemAmount < 0)
                return callback(new CustomInputError('Invalid Item Amount.'));
            if (!isValidUnitCode(item.ItemUnitCode))
                return callback(new CustomInputError('Invalid Item Unit Code.'));
            if (typeof item.ItemDescription !== 'string' || !item.ItemDescription.trim())
                return callback(new CustomInputError('Invalid Item Description.'));
        }

        await db.query('BEGIN');

        await db.query(`
           INSERT INTO orders (SalesOrderID, UUID, IssueDate, PartyNameBuyer, PartyNameSeller, PayableAmount, PayableCurrencyCode)
           VALUES ($1, $2, $3, $4, $4, $5, $6);
       `, [SalesOrderID, UUID, IssueDate, PartyName, PayableAmount, PayableCurrencyCode]);

        for (const item of Items) {
            await db.query(`
               INSERT INTO order_items (SalesOrderID, ItemDescription, BuyersItemIdentification, SellersItemIdentification, ItemAmount, ItemUnitCode)
               VALUES ($1, $2, $3, $4, $5, $6);
           `, [SalesOrderID, item.ItemDescription, item.BuyersItemIdentification, item.SellersItemIdentification, item.ItemAmount, item.ItemUnitCode]);
        }

        await db.query('COMMIT');
        callback(null, { success: true, message: 'Order and items inserted successfully.' });
    } catch (err) {
        console.error("Error inserting order and items:", err.message);
        await db.query('ROLLBACK');
        return callback(new CustomInputError('Error processing order insert.'));
    }
}

/**
 * Get the full order details from SalesOrderID
 *
 * @param {String} SalesOrderID
 * @param {function} callback - callback function to handle the result
 **/
export async function getOrderBySalesOrderID(SalesOrderID, callback) {
    try {
        const res = await db.query(`SELECT * FROM orders WHERE SalesOrderID = $1;`, [SalesOrderID]);
        if (res.rows.length === 0) return callback(new CustomInputError('Order not found.'));
        callback(null, res.rows[0]);
    } catch (err) {
        console.error("SQL Error while fetching order:", err.message);
        return callback(new CustomInputError('Database error while fetching order.'));
    }
}

/**
 * Get a list of SalesOrderIDs from a party's name
 *
 * @param {String} PartyName
 * @param {function} callback - callback function to handle the result
 **/
export async function getOrderIdsByPartyName(PartyName, callback) {
    try {
        const res = await db.query(`SELECT SalesOrderID FROM orders WHERE PartyNameBuyer = $1;`, [PartyName]);
        if (!res.rows || res.rows.length === 0) {
            return callback(new CustomInputError('No orders found for this Party Name.'));
        }
        callback(null, res.rows.map(row => row.salesorderid));
    } catch (err) {
        console.error("SQL Error while fetching order IDs:", err.message);
        return callback(new CustomInputError('Database error while fetching order IDs.'));
    }
}

/**
 * Delete an order from database given SalesOrderIDs
 *
 * @param {String} SalesOrderID
 * @param {function} callback - callback function to handle the result
 **/
export async function deleteOrderById(SalesOrderID, callback) {
    try {
        await db.query('BEGIN');

        await db.query(`DELETE FROM order_items WHERE SalesOrderID = $1;`, [SalesOrderID]);
        const res = await db.query(`DELETE FROM orders WHERE SalesOrderID = $1 RETURNING *;`, [SalesOrderID]);

        if (res.rowCount === 0) {
            await db.query('ROLLBACK');
            return callback(new CustomInputError('Order not found.'));
        }

        await db.query('COMMIT');
        callback(null, { success: true, message: 'Order and related items deleted successfully.' });
    } catch (err) {
        console.error("SQL Error while deleting order:", err.message);
        await db.query('ROLLBACK');
        return callback(new CustomInputError('Error committing delete transaction.'));
    }
}