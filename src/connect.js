import sqlite3 from 'sqlite3';
import fs from 'fs';

// Check for testing
const isTestEnv = process.env.NODE_ENV === 'test';

const dbPath = './database.db';

// Ensure database file exists before opening
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
}

const sql3 = sqlite3.verbose();
const db = new sql3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Connected successfully.');
});

// make sure the orders table exists
const sql_orders_table = `
    CREATE TABLE IF NOT EXISTS orders (
          SalesOrderID TEXT PRIMARY KEY,
          UUID TEXT NOT NULL,
          IssueDate TEXT NOT NULL,
          PartyName TEXT NOT NULL,
          PayableAmount REAL NOT NULL,
          PayableCurrencyCode TEXT NOT NULL
    );
`;

db.run(sql_orders_table, (err) => {
    if (err) {
        console.error('Error while creating orders table:', err.message);
    } else {
        if (!isTestEnv) console.log('Orders table is a go!');
    }
});

// make sure that the invoices table is made correctly
const sql_order_items_table = `
    CREATE TABLE IF NOT EXISTS order_items (
        ItemID INTEGER PRIMARY KEY AUTOINCREMENT,
        SalesOrderID TEXT NOT NULL,
        ItemDescription TEXT NOT NULL,
        BuyersItemIdentification INTEGER NOT NULL,
        SellersItemIdentification INTEGER NOT NULL,
        ItemAmount INTEGER NOT NULL,
        ItemUnitCode TEXT NOT NULL,
        FOREIGN KEY (SalesOrderID) REFERENCES orders(SalesOrderID) ON DELETE CASCADE
    );
`;

db.run(sql_order_items_table, (err) => {
    if (err) {
        console.error('Error while creating order items table:', err.message);
    } else {
        if (!isTestEnv) console.log('Order items table is a go!');
    }
});

export { db };
