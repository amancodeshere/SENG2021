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
          OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
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

const sql_order_items_table = `
    CREATE TABLE IF NOT EXISTS order_items (
        ItemID INTEGER PRIMARY KEY AUTOINCREMENT,
        OrderItemId TEXT NOT NULL,
        OrderID TEXT NOT NULL,
        ItemName TEXT,
        ItemDescription TEXT,
        ItemPrice REAL NOT NULL,
        ItemQuantity INTEGER NOT NULL,
        ItemUnitCode TEXT NOT NULL,
        FOREIGN KEY (OrderID) REFERENCES orders(OrderId) ON DELETE CASCADE
    );
`;

db.run(sql_order_items_table, (err) => {
    if (err) {
        console.error('Error while creating order items table:', err.message);
    } else {
        if (!isTestEnv) console.log('Order items table is a go!');
    }
});

// create an invoices table
const sql_invoices_table = `
    CREATE TABLE IF NOT EXISTS invoices (
        InvoiceID INTEGER PRIMARY KEY AUTOINCREMENT,
        IssueDate TEXT NOT NULL,
        PartyNameBuyer TEXT NOT NULL,
        PayableAmount REAL NOT NULL,
        CurrencyCode TEXT NOT NULL
    );
`;

db.run(sql_invoices_table, (err) => {
    if (err) {
        console.error('Error while creating invoices table:', err.message);
    } else {
        if (!isTestEnv) console.log('Invoices table is a go!');
    }
});

// create an invoice items table
const sql_invoice_items_table = `
    CREATE TABLE IF NOT EXISTS invoice_items (
        InvoiceItemID INTEGER PRIMARY KEY AUTOINCREMENT,
        InvoiceID INTEGER NOT NULL,
        ItemName TEXT,
        ItemDescription TEXT,
        ItemPrice REAL NOT NULL,
        ItemQuantity INTEGER NOT NULL,
        ItemUnitCode TEXT NOT NULL,
        FOREIGN KEY (InvoiceID) REFERENCES invoices(InvoiceID) ON DELETE CASCADE
    );
`;

db.run(sql_invoice_items_table, (err) => {
    if (err) {
        console.error('Error while creating invoice items table:', err.message);
    } else {
        if (!isTestEnv) console.log('Invoice items table is a go!');
    }
});

// create users table
const sql_users_table = `
    CREATE TABLE IF NOT EXISTS users (
        UserID INTEGER PRIMARY KEY AUTOINCREMENT,
        Email TEXT UNIQUE NOT NULL,
        Password TEXT NOT NULL,
        CompanyName TEXT NOT NULL
    );
`;

db.run(sql_users_table, (err) => {
    if (err) {
        console.error('Error while creating users table:', err.message);
    } else {
        if (!isTestEnv) console.log('Users table is a go!');
    }
});

// create sessions table
const sql_sessions_table = `
    CREATE TABLE IF NOT EXISTS sessions (
        SessionID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        NumLogins INTEGER DEFAULT 0 NOT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
    );

`;

db.run(sql_sessions_table, (err) => {
    if (err) {
        console.error('Error while creating sessions table:', err.message);
    } else {
        if (!isTestEnv) console.log('Sessions table is a go!');
    }
})

export { db };
