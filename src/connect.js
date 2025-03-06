import sqlite3 from 'sqlite3';
import fs from 'fs';

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

// Ensure the orders table exists
const sql_orders_table = `
    CREATE TABLE IF NOT EXISTS orders (
          SalesOrderID TEXT PRIMARY KEY,
          UUID TEXT NOT NULL,
          IssueDate TEXT NOT NULL,
          PartyName TEXT NOT NULL,
          PayableAmount INTEGER NOT NULL,
          PayableCurrencyCode TEXT NOT NULL,
          ItemDescription TEXT NOT NULL,
          BuyersItemIdentification INTEGER NOT NULL,
          SellersItemIdentification INTEGER NOT NULL,
          ItemAmount INTEGER NOT NULL,
          ItemUnitCode TEXT NOT NULL
    );
`;

db.run(sql_orders_table, (err) => {
    if (err) {
        console.error('Error while creating orders table:', err.message);
    } else {
        console.log('Orders table is a go!');
    }
});

export { db };
