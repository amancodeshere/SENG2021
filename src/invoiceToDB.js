import { db } from './connect.js';
import { CustomInputError } from './errors.js';


/**
 * Inserts an invoice into the database based on an existing order.
 *
 * @param {string} SalesOrderID - ID of the sales order to convert into an invoice.
 * @param {function} callback - Callback to handle result or error.
 */
export async function inputInvoice(SalesOrderID, callback) {
    try {
        await db.query('BEGIN');

        const orderResult = await db.query(
            `SELECT IssueDate, PartyNameBuyer, PartyNameSeller, PayableCurrencyCode AS CurrencyCode
             FROM orders WHERE SalesOrderID = $1;`,
            [SalesOrderID]
        );

        if (orderResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return callback(new CustomInputError("Order not found."));
        }

        const order = orderResult.rows[0];

        const invoiceInsertResult = await db.query(
            `INSERT INTO invoices (IssueDate, PartyNameBuyer, PartyNameSeller, CurrencyCode, SalesOrderID)
             VALUES ($1, $2, $3, $4, $5) RETURNING InvoiceID;`,
            [order.issuedate, order.partynamebuyer, order.partynameseller, order.currencycode, SalesOrderID]
        );

        const InvoiceID = invoiceInsertResult.rows[0].invoiceid;

        const itemsResult = await db.query(
            `SELECT ItemDescription, BuyersItemIdentification, SellersItemIdentification, ItemAmount, ItemUnitCode
             FROM order_items WHERE SalesOrderID = $1;`,
            [SalesOrderID]
        );

        if (itemsResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return callback(new CustomInputError("No items found for this order."));
        }

        let count = 1;
        for (const item of itemsResult.rows) {
            await db.query(
                `INSERT INTO invoice_items (
                    InvoiceID, InvoiceItemName, ItemDescription, BuyersItemIdentification, SellersItemIdentification,
                    ItemPrice, ItemQuantity, ItemUnitCode
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
                [
                    InvoiceID,
                    `Item ${count++}`,
                    item.itemdescription,
                    item.buyersitemidentification,
                    item.sellersitemidentification,
                    item.itemamount,
                    1, // Default quantity since not specified
                    item.itemunitcode
                ]
            );
        }


        await db.query('COMMIT');
        callback(null, { success: true, message: "Invoice created successfully.", InvoiceID });
    } catch (err) {
        console.error("Invoice creation error:", err.message);
        await db.query('ROLLBACK');
        return callback(new CustomInputError("Error during invoice creation."));
    }
}


/**
 * Retrieves full invoice details including items based on a given InvoiceID.
 *
 * @param {number} InvoiceID - The ID of the invoice to retrieve.
 * @param {function} callback - Callback to handle result or error.
 */
export function getInvoiceByID(InvoiceID, callback) {
    db.query(
        `SELECT InvoiceID, IssueDate, PartyNameBuyer, PartyNameSeller, CurrencyCode, SalesOrderID
         FROM invoices WHERE InvoiceID = $1;`,
        [InvoiceID]
    )
        .then(invoiceRes => {
            if (invoiceRes.rows.length === 0) return callback(new CustomInputError("Invoice not found."));
            const invoice = invoiceRes.rows[0];


            db.query(
                `SELECT InvoiceItemName, ItemDescription, BuyersItemIdentification, SellersItemIdentification, ItemPrice, ItemQuantity, ItemUnitCode
                 FROM invoice_items WHERE InvoiceID = $1;`,
                [InvoiceID]
            )
                .then(itemRes => callback(null, { ...invoice, Items: itemRes.rows }))
                .catch(err => {
                    console.error("Fetch invoice items error:", err.message);
                    callback(new CustomInputError("Database error while fetching invoice items."));
                });
        })
        .catch(err => {
            console.error("Fetch invoice error:", err.message);
            callback(new CustomInputError("Database error while fetching invoice."));
        });
}


/**
 * Retrieves all invoices for a specific buyer company.
 *
 * @param {string} PartyNameBuyer - The name of the buyer company.
 * @param {function} callback - Callback to handle result or error.
 */
export function getInvoicesByCompanyName(PartyNameBuyer, callback) {
    db.query(
        `SELECT * FROM invoices WHERE PartyNameBuyer = $1;`,
        [PartyNameBuyer]
    )
        .then(res => {
            if (res.rows.length === 0) return callback(new CustomInputError("No invoices found for this company."));
            callback(null, res.rows);
        })
        .catch(err => {
            console.error("Fetch invoices by company error:", err.message);
            callback(new CustomInputError("Database error while fetching invoices."));
        });
}


/**
 * Deletes a specific invoice and all its associated items from the database.
 *
 * @param {number} InvoiceID - The ID of the invoice to delete.
 * @param {function} callback - Callback to handle result or error.
 */
export async function deleteInvoiceById(InvoiceID, callback) {
    try {
        await db.query('BEGIN');

        await db.query(`DELETE FROM invoice_items WHERE InvoiceID = $1;`, [InvoiceID]);
        const res = await db.query(`DELETE FROM invoices WHERE InvoiceID = $1 RETURNING *;`, [InvoiceID]);

        if (res.rowCount === 0) {
            await db.query('ROLLBACK');
            return callback(new CustomInputError("Invoice not found."));
        }

        await db.query('COMMIT');
        callback(null, { success: true, message: "Invoice and related items deleted successfully." });
    } catch (err) {
        console.error("Invoice deletion error:", err.message);
        await db.query('ROLLBACK');
        callback(new CustomInputError("Error during invoice deletion."));
    }
}
