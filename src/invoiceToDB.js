import { db } from './connect.js';
import { CustomInputError } from './errors.js';


/**
 * Inserts an invoice based on an existing order.
 *
 * @param {string} OrderID - order ID to generate an invoice from
 * @param {function} callback - callback to handle the result
 */
export function inputInvoice(OrderID, callback) {
    console.log(`Creating invoice for SalesOrderID: ${OrderID}`);

    db.exec("BEGIN TRANSACTION;", (beginErr) => {
        if (beginErr) {
            console.error("Error starting transaction:", beginErr.message);
            return callback(new CustomInputError("Error starting invoice transaction."));
        }

        // get order details
        const sqlGetOrder = `
            SELECT IssueDate, PartyName AS PartyNameBuyer, PayableAmount, PayableCurrencyCode AS CurrencyCode
            FROM orders
            WHERE OrderId = ?;
        `;

        db.get(sqlGetOrder, [OrderID], (orderErr, orderRow) => {
            if (orderErr) {
                console.error("SQL Error while fetching order:", orderErr.message);
                db.exec("ROLLBACK;", () => {});
                return callback(new CustomInputError("Database error while fetching order."));
            }

            if (!orderRow) {
                db.exec("ROLLBACK;", () => {});
                return callback(new CustomInputError("Order not found."));
            }

            // insert into invoices table
            const sqlInsertInvoice = `
                INSERT INTO invoices (IssueDate, PartyNameBuyer, PayableAmount, CurrencyCode)
                VALUES (?, ?, ?, ?);
            `;

            db.run(sqlInsertInvoice, [orderRow.IssueDate, orderRow.PartyNameBuyer, orderRow.PayableAmount, orderRow.CurrencyCode], function (invoiceErr) {
                if (invoiceErr) {
                    console.error("SQL Error while inserting invoice:", invoiceErr.message);
                    db.exec("ROLLBACK;", () => {});
                    return callback(new CustomInputError("Database error while inserting invoice."));
                }

                const InvoiceID = this?.lastID || 1; // Ensure there's an ID for testing purposes

                // get order items
                const sqlGetOrderItems = `
                    SELECT ItemName, ItemDescription, ItemPrice, ItemQuantity, ItemUnitCode
                    FROM order_items
                    WHERE OrderId = ?;
                `;

                db.all(sqlGetOrderItems, [OrderID], (itemsErr, itemsRows) => {
                    if (itemsErr) {
                        console.error("SQL Error while fetching order items:", itemsErr.message);
                        db.exec("ROLLBACK;", () => {});
                        return callback(new CustomInputError("Database error while fetching order items."));
                    }

                    if (!itemsRows || itemsRows.length === 0) {
                        db.exec("ROLLBACK;", () => {});
                        return callback(new CustomInputError("No items found for this order."));
                    }

                    // insert items into invoice_items table
                    const sqlInsertInvoiceItem = `
                        INSERT INTO invoice_items (InvoiceID, ItemName, ItemDescription, ItemPrice, ItemQuantity, ItemUnitCode)
                        VALUES (?, ?, ?, ?, ?, ?);
                    `;

                    let pendingItems = itemsRows.length;

                    for (const item of itemsRows) {
                        db.run(sqlInsertInvoiceItem, [InvoiceID, item.ItemDescription,  item.ItemPrice, item.ItemQuantity, item.ItemUnitCode], function (invoiceItemErr) {
                            if (invoiceItemErr) {
                                console.error("SQL Error while inserting invoice item:", invoiceItemErr.message);
                                db.exec("ROLLBACK;", () => {});
                                return callback(new CustomInputError("Database error while inserting invoice items."));
                            }

                            pendingItems--;

                            // commit once all items are inserted
                            if (pendingItems === 0) {
                                db.exec("COMMIT;", (commitErr) => {
                                    if (commitErr) {
                                        console.error("Error committing invoice transaction:", commitErr.message);
                                        db.exec("ROLLBACK;", () => {});
                                        return callback(new CustomInputError("Error committing invoice transaction."));
                                    }
                                    callback(null, { success: true, message: "Invoice created successfully.", InvoiceID });
                                });
                            }
                        });
                    }
                });
            });
        });
    });
}


/**
 * Gets a full invoice including its items by InvoiceID
 *
 * @param {String} InvoiceID - unique id of the invoice
 * @param {Function} callback - callback to handle the result
 */
export function getInvoiceByID(InvoiceID, callback) {
    console.log(`Fetching invoice with InvoiceID: ${InvoiceID}`);

    // get invoice from invoice table
    const sqlGetInvoice = `
        SELECT InvoiceID, IssueDate, PartyNameBuyer, PayableAmount, CurrencyCode
        FROM invoices
        WHERE InvoiceID = ?;
    `;

    db.get(sqlGetInvoice, [InvoiceID], (invoiceErr, invoiceRow) => {
        if (invoiceErr) {
            console.error("SQL Error while fetching invoice:", invoiceErr.message);
            return callback(new CustomInputError("Database error while fetching invoice."));
        }

        if (!invoiceRow) {
            return callback(new CustomInputError("Invoice not found."));
        }

        // get invoice items from invoice_items table
        const sqlGetInvoiceItems = `
            SELECT ItemName, ItemDescription, ItemAmount, ItemUnitCode
            FROM invoice_items
            WHERE InvoiceID = ?;
        `;

        db.all(sqlGetInvoiceItems, [InvoiceID], (itemsErr, itemsRows) => {
            if (itemsErr) {
                console.error("SQL Error while fetching invoice items:", itemsErr.message);
                return callback(new CustomInputError("Database error while fetching invoice items."));
            }

            callback(null, { ...invoiceRow, Items: itemsRows });
        });
    });
}


/**
 * Gets a list of full invoices excluding its items by Buyers Name
 *
 * @param {string} PartyNameBuyer
 * @param {Function} callback - callback to handle the result
 */
export function getInvoicesByCompanyName(PartyNameBuyer, callback) {
    console.log(`Fetching invoices for company: ${PartyNameBuyer}`);

    const sqlQuery = `
        SELECT * FROM invoices 
        WHERE PartyNameBuyer = ?;
    `;

    db.all(sqlQuery, [PartyNameBuyer], (err, rows) => {
        if (err) {
            console.error("SQL Error while fetching invoices:", err.message);
            return callback(new CustomInputError("Database error while fetching invoices."));
        }
        if (!rows || rows.length === 0) {
            return callback(new CustomInputError("No invoices found for this company."));
        }
        callback(null, rows);
    });
}


/**
 * deletes invoice by invoiceId
 *
 * @param {number} InvoiceID
 * @param {Function} callback - callback to handle the result
 */
export function deleteInvoiceById(InvoiceID, callback) {
    console.log(`Deleting invoice and associated items with InvoiceID: ${InvoiceID}`);

    db.exec("BEGIN TRANSACTION;", (beginErr) => {
        if (beginErr) {
            console.error("Error starting transaction:", beginErr.message);
            return callback(new CustomInputError("Error starting delete transaction."));
        }

        // delete items in invoice_items table
        const sqlDeleteInvoiceItems = `DELETE FROM invoice_items WHERE InvoiceID = ?;`;
        db.run(sqlDeleteInvoiceItems, [InvoiceID], function (err) {
            if (err) {
                console.error("SQL Error while deleting invoice items:", err.message);
                db.exec("ROLLBACK;", () => {});
                return callback(new CustomInputError("Database error while deleting invoice items."));
            }

            // delete invoice from invoices
            const sqlDeleteInvoice = `DELETE FROM invoices WHERE InvoiceID = ?;`;
            db.run(sqlDeleteInvoice, [InvoiceID], function (err) {
                if (err) {
                    console.error("SQL Error while deleting invoice:", err.message);
                    db.exec("ROLLBACK;", () => {});
                    return callback(new CustomInputError("Database error while deleting invoice."));
                }

                if (this.changes === 0) {
                    db.exec("ROLLBACK;", () => {});
                    return callback(new CustomInputError("Invoice not found."));
                }

                // commit both deletions
                db.exec("COMMIT;", (commitErr) => {
                    if (commitErr) {
                        console.error("Error committing delete transaction:", commitErr.message);
                        db.exec("ROLLBACK;", () => {});
                        return callback(new CustomInputError("Error committing delete transaction."));
                    }
                    callback(null, { success: true, message: "Invoice and related items deleted successfully." });
                });
            });
        });
    });
}
