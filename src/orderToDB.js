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
 * Inserts an order and its items into the database.
 */
export async function inputOrder(
    SalesOrderID,
    UUID,
    IssueDate,
    PartyNameBuyer,
    PartyNameSeller,
    PayableAmount,
    PayableCurrencyCode,
    Items,
    callback
) {
    try {
        // 1) validate inputs
        const existing = await db.query(
            "SELECT COUNT(*) FROM orders WHERE salesorderid=$1",
            [SalesOrderID]
        );
        if (parseInt(existing.rows[0].count, 10) > 0) {
            throw new CustomInputError("SalesOrderID already exists.");
        }
        if (!validateUUID(UUID)) throw new CustomInputError("Invalid UUID.");
        if (!isValidIssueDate(IssueDate)) throw new CustomInputError("Invalid IssueDate.");
        if (!isValidPartyName(PartyNameBuyer))
            throw new CustomInputError("Invalid Buyer party name.");
        if (!isValidPartyName(PartyNameSeller))
            throw new CustomInputError("Invalid Seller party name.");
        if (typeof PayableAmount !== "number" || PayableAmount < 0)
            throw new CustomInputError("Invalid payable amount.");
        if (!isValidCurrencyCode(PayableCurrencyCode))
            throw new CustomInputError("Invalid currency code.");
        if (!Array.isArray(Items) || Items.length === 0)
            throw new CustomInputError("Items list may not be empty.");

        for (const it of Items) {
            if (!it.OrderItemId || typeof it.OrderItemId !== "string")
                throw new CustomInputError("Invalid OrderItemId.");
            if (!it.ItemName || typeof it.ItemName !== "string")
                throw new CustomInputError("Invalid ItemName.");
            if (typeof it.ItemPrice !== "number" || it.ItemPrice < 0)
                throw new CustomInputError("Invalid ItemPrice.");
            if (typeof it.ItemQuantity !== "number" || it.ItemQuantity < 0)
                throw new CustomInputError("Invalid ItemQuantity.");
            if (!isValidUnitCode(it.ItemUnitCode))
                throw new CustomInputError("Invalid ItemUnitCode.");
            if (!it.ItemDescription || typeof it.ItemDescription !== "string")
                throw new CustomInputError("Invalid ItemDescription.");
        }

        // 2) transactionally insert
        await db.query("BEGIN");

        await db.query(
            `
                INSERT INTO orders
                (salesorderid, uuid, issuedate,
                 partynamebuyer, partynameseller,
                 payableamount, payablecurrencycode)
                VALUES ($1,$2,$3,$4,$5,$6,$7)
            `,
            [
                SalesOrderID,
                UUID,
                IssueDate,
                PartyNameBuyer,
                PartyNameSeller,
                PayableAmount,
                PayableCurrencyCode,
            ]
        );

        for (const it of Items) {
            await db.query(
                `
                    INSERT INTO order_items
                    (orderitemid, salesorderid, itemname,
                     itemdescription, itemprice,
                     itemquantity, itemunitcode)
                    VALUES ($1,$2,$3,$4,$5,$6,$7)
                `,
                [
                    it.OrderItemId,
                    SalesOrderID,
                    it.ItemName,
                    it.ItemDescription,
                    it.ItemPrice,
                    it.ItemQuantity,
                    it.ItemUnitCode,
                ]
            );
        }

        await db.query("COMMIT");
        callback(null, { success: true, message: "Order & items inserted." });
    } catch (err) {
        await db.query("ROLLBACK");
        console.error("Error inserting order:", err.message || err);
        callback(
            err instanceof CustomInputError
                ? err
                : new CustomInputError("Error processing order insert.")
        );
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
        console.error("SQL Error while deleting order:", err.message || err);
        await db.query('ROLLBACK');
        return callback(new CustomInputError('Error committing delete transaction.'));
    }
}