import { db } from './connect.js';
import { CustomInputError } from './errors.js';


/**
 * Inserts a new invoice (and its items) for the given SalesOrderID.
 *
 * @param {string} salesOrderId
 * @param {function} callback (err, { InvoiceID })
 */
export function inputInvoice(salesOrderId, callback) {
    const insertInvoiceSql = `
    INSERT INTO invoices
      (IssueDate, PartyNameSeller, PartyNameBuyer, CurrencyCode, SalesOrderID)
    SELECT
      o.IssueDate,
      o.PartyNameSeller,
      o.PartyNameBuyer,
      o.PayableCurrencyCode,
      o.SalesOrderID
    FROM orders o
    WHERE o.SalesOrderID = $1
    RETURNING InvoiceID;
  `;

    db.query(insertInvoiceSql, [salesOrderId])
        .then(invoiceRes => {
            if (invoiceRes.rowCount === 0) {
                throw new CustomInputError('No such order to invoice.');
            }
            const invoiceId = invoiceRes.rows[0].invoiceid;

            const fetchItemsSql = `
        SELECT
          ItemID,
          ItemName,
          ItemDescription,
          ItemPrice,
          ItemQuantity,
          ItemUnitCode
        FROM order_items
        WHERE SalesOrderID = $1;
      `;
            return db.query(fetchItemsSql, [salesOrderId])
                .then(itemsRes => {
                    if (!itemsRes.rows.length) {
                        throw new CustomInputError('Order has no items to invoice.');
                    }
                    const insertItemPromises = itemsRes.rows.map(item =>
                        db.query(
                            `INSERT INTO invoice_items
                (InvoiceID,
                 InvoiceItemName,
                 ItemDescription,
                 SellersItemIdentification,
                 ItemPrice,
                 ItemQuantity,
                 ItemUnitCode)
               VALUES ($1,$2,$3,$4,$5,$6,$7);`,
                            [
                                invoiceId,
                                item.itemname,
                                item.itemdescription,
                                item.itemid,
                                item.itemprice,
                                item.itemquantity,
                                item.itemunitcode
                            ]
                        )
                    );
                    return Promise.all(insertItemPromises)
                        .then(() => ({ invoiceId }));
                });
        })
        .then(({ invoiceId }) => {
            callback(null, { InvoiceID: invoiceId });
        })
        .catch(err => {
            console.error('Invoice creation error:', err.message || err);
            callback(err instanceof CustomInputError ? err : new CustomInputError('Error creating invoice.'));
        });
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
                `SELECT InvoiceItemName, ItemDescription, SellersItemIdentification, ItemPrice, ItemQuantity, ItemUnitCode
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
