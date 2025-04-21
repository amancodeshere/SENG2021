import { db } from './connect.js';
import { CustomInputError } from './errors.js';


/**
 * Inserts a new invoice (and its items) for the given SalesOrderID.
 *
 * @param SalesOrderID
 * @param {function} callback (err, { InvoiceID })
 */
export async function inputInvoice(SalesOrderID, callback) {
    try {
        await db.query('BEGIN');

        const orderResult = await db.query(
            `SELECT IssueDate, PartyNameBuyer, PartyNameSeller, PayableCurrencyCode AS CurrencyCode
         FROM orders
        WHERE SalesOrderID = $1;`,
            [SalesOrderID]
        );
        if (orderResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return callback(new CustomInputError("Order not found."));
        }
        const order = orderResult.rows[0];

        const invoiceInsert = await db.query(
            `INSERT INTO invoices
         (IssueDate, PartyNameBuyer, PartyNameSeller, CurrencyCode, SalesOrderID)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING InvoiceID;`,
            [order.issuedate, order.partynamebuyer, order.partynameseller, order.currencycode, SalesOrderID]
        );
        const InvoiceID = invoiceInsert.rows[0].invoiceid;

        const itemsResult = await db.query(
            `SELECT ItemID, ItemName, ItemDescription, ItemPrice, ItemQuantity, ItemUnitCode
         FROM order_items
        WHERE SalesOrderID = $1;`,
            [SalesOrderID]
        );
        if (itemsResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return callback(new CustomInputError("No items found for this order."));
        }

        for (const item of itemsResult.rows) {
            await db.query(
                `INSERT INTO invoice_items
           (InvoiceID, InvoiceItemName, ItemDescription, SellersItemIdentification,
            ItemPrice, ItemQuantity, ItemUnitCode)
         VALUES ($1,$2,$3,$4,$5,$6,$7);`,
                [
                    InvoiceID,
                    item.itemname,
                    item.itemdescription,
                    item.itemid,
                    item.itemprice,
                    item.itemquantity,
                    item.itemunitcode
                ]
            );
        }

        await db.query('COMMIT');
        callback(null, { success: true, message: "Invoice created successfully.", InvoiceID });
    } catch (err) {
        console.error("Invoice creation error:", err.message);
        await db.query('ROLLBACK');
        callback(new CustomInputError("Error during invoice creation."));
    }
}



/**
 * Fetch one invoice plus its line‑items
 * @param {number} invoiceId
 * @param {function(err, result)} callback
 */
export function getInvoiceByID(invoiceId, callback) {
    // 1) Fetch the invoice header
    const invoiceSql = `
    SELECT
      invoiceid,
      issuedate,
      partynamebuyer,
      currencycode
    FROM invoices
    WHERE invoiceid = $1
  `;

    db.query(invoiceSql, [invoiceId])
        .then(invRes => {
            if (invRes.rowCount === 0) {
                return callback(new CustomInputError('Invoice not found.'));
            }
            const header = invRes.rows[0];
            const itemsSql = `
        SELECT
          invoiceitemid AS invoiceitemid,
          invoiceitemname AS invoiceitemname,
          itemdescription AS itemdescription,
          itemprice AS itemprice,
          itemquantity AS itemquantity,
          itemunitcode AS itemunitcode
        FROM invoice_items
        WHERE invoiceid = $1
      `;


            return db.query(itemsSql, [invoiceId])
                .then(itemsRes => {
                    callback(null, {
                        invoiceid: header.invoiceid,
                        issuedate: header.issuedate,
                        partynamebuyer: header.partynamebuyer,
                        currencycode: header.currencycode,
                        Items: itemsRes.rows
                    });
                });
        })
        .catch(err => {
            console.error('Fetch invoice error:', err.message);
            callback(new CustomInputError('Database error while fetching invoice.'));
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
