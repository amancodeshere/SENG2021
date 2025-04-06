import pkg from 'pg';
const { Pool } = pkg;

import dotenv from 'dotenv';
dotenv.config();

const isTestEnv = process.env.NODE_ENV === 'test';

// Environment-based database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// connect and log success or failure
pool.connect((err, client, release) => {
    if (err) {
        console.error('PostgreSQL connection error:', err);
    } else {
        console.log('Connected to PostgreSQL database successfully.');
        release();
    }
});

// create tables
const schema = [
    `CREATE TABLE IF NOT EXISTS orders (
    SalesOrderID TEXT PRIMARY KEY,
    UUID TEXT NOT NULL,
    IssueDate DATE NOT NULL,
    PartyNameBuyer TEXT NOT NULL,
    PartyNameSeller TEXT NOT NULL,
    PayableAmount REAL NOT NULL,
    PayableCurrencyCode TEXT NOT NULL
  );`,

    `CREATE TABLE IF NOT EXISTS order_items (
    ItemID SERIAL PRIMARY KEY,
    OrderItemId TEXT NOT NULL,
    SalesOrderID TEXT NOT NULL,
    ItemName TEXT NOT NULL,
    ItemDescription TEXT Not NULL,
    ItemPrice REAL NOT NULL,
    ItemQuantity INTEGER NOT NULL,
    ItemUnitCode TEXT NOT NULL,
    FOREIGN KEY (SalesOrderID) REFERENCES orders(SalesOrderID) ON DELETE CASCADE
  );`,

    `CREATE TABLE IF NOT EXISTS invoices (
    InvoiceID SERIAL PRIMARY KEY,
    IssueDate DATE NOT NULL,
    PartyNameSeller Text NOT NULL,
    PartyNameBuyer TEXT NOT NULL,
    CurrencyCode TEXT NOT NULL,
    InvoiceStartDate DATE DEFAULT NULL,
    InvoiceEndDate DATE DEFAULT NULL,
    SalesOrderID TEXT NOT NULL,
    FOREIGN KEY (SalesOrderID) REFERENCES orders(SalesOrderID) ON DELETE CASCADE
  );`,

    `CREATE TABLE IF NOT EXISTS invoice_items (
    InvoiceItemID SERIAL PRIMARY KEY,
    InvoiceID INTEGER NOT NULL,
    InvoiceItemName TEXT NOT NULL,
    ItemDescription TEXT NOT NULL,
    BuyersItemIdentification INTEGER NOT NULL,
    SellersItemIdentification INTEGER NOT NULL,
    ItemPrice REAL NOT NULL,
    ItemQuantity INTEGER NOT NULL,
    ItemUnitCode TEXT NOT NULL,
    FOREIGN KEY (InvoiceID) REFERENCES invoices(InvoiceID) ON DELETE CASCADE
  );`,

    `CREATE TABLE IF NOT EXISTS users (
    UserID SERIAL PRIMARY KEY,
    Email TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    CompanyName TEXT NOT NULL,
    NumLogins INTEGER DEFAULT 0 NOT NULL
  );`,

    `CREATE TABLE IF NOT EXISTS sessions (
    SessionID SERIAL PRIMARY KEY,
    UserID INTEGER NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
  );`
];


// run schema creation
schema.forEach(async (query) => {
    try {
        await pool.query(query);
        if (!isTestEnv) console.log('Table ensured/created.');
    } catch (err) {
        console.error('Error creating table:', err.message);
    }
});

export { pool as db };
