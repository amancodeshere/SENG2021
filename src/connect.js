import sqlite3 from 'sqlite3';
import fs from 'fs';
import AWS from 'aws-sdk';
import path from 'path';

// AWS S3 Configuration
const S3_BUCKET = process.env.S3_BUCKET_NAME;  // Set in AWS Lambda environment variables
const S3_DB_KEY = 'database.db';  // File name in S3 bucket
const LOCAL_DB_PATH = '/tmp/database.db';  // Lambda requires /tmp for writes

// Initialize AWS S3 SDK
const s3 = new AWS.S3();

// Download database from S3 before using SQLite
async function downloadDatabaseFromS3() {
    return new Promise((resolve, reject) => {
        console.log("Downloading database from S3...");

        const params = {
            Bucket: S3_BUCKET,
            Key: S3_DB_KEY
        };

        s3.getObject(params, (err, data) => {
            if (err) {
                console.error("Error fetching database from S3:", err.message);
                return reject(new Error("Failed to download database from S3."));
            }

            // Write file to Lambda's /tmp directory
            fs.writeFileSync(LOCAL_DB_PATH, data.Body);
            console.log("Database successfully downloaded from S3.");
            resolve();
        });
    });
}

// Ensure Database Exists
async function ensureDatabaseExists() {
    try {
        if (!fs.existsSync(LOCAL_DB_PATH)) {
            console.log("Database file does not exist locally. Fetching from S3...");
            await downloadDatabaseFromS3();
        } else {
            console.log("Database file found locally.");
        }
    } catch (error) {
        console.error("Error ensuring database exists:", error.message);
    }
}

// Initialize SQLite
async function initializeDatabase() {
    await ensureDatabaseExists();  // Ensure DB is available before connecting

    const sql3 = sqlite3.verbose();
    const db = new sql3.Database(LOCAL_DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
            console.error('Database connection error:', err.message);
            return;
        }
        console.log('Connected successfully to SQLite.');
    });

    // Create Tables if not exists
    const tables = [
        `CREATE TABLE IF NOT EXISTS orders (
            SalesOrderID TEXT PRIMARY KEY,
            UUID TEXT NOT NULL,
            IssueDate TEXT NOT NULL,
            PartyName TEXT NOT NULL,
            PayableAmount REAL NOT NULL,
            PayableCurrencyCode TEXT NOT NULL
        );`,

        `CREATE TABLE IF NOT EXISTS order_items (
            ItemID INTEGER PRIMARY KEY AUTOINCREMENT,
            SalesOrderID TEXT NOT NULL,
            ItemDescription TEXT NOT NULL,
            BuyersItemIdentification INTEGER NOT NULL,
            SellersItemIdentification INTEGER NOT NULL,
            ItemAmount INTEGER NOT NULL,
            ItemUnitCode TEXT NOT NULL,
            FOREIGN KEY (SalesOrderID) REFERENCES orders(SalesOrderID) ON DELETE CASCADE
        );`,

        `CREATE TABLE IF NOT EXISTS invoices (
            InvoiceID INTEGER PRIMARY KEY AUTOINCREMENT,
            IssueDate TEXT NOT NULL,
            PartyNameBuyer TEXT NOT NULL,
            PayableAmount REAL NOT NULL,
            CurrencyCode TEXT NOT NULL,
            InvoiceStartDate TEXT DEFAULT NULL,
            InvoiceEndDate TEXT DEFAULT NULL,
            SalesOrderID TEXT NOT NULL,
            FOREIGN KEY (SalesOrderID) REFERENCES orders(SalesOrderID) ON DELETE CASCADE
        );`,

        `CREATE TABLE IF NOT EXISTS invoice_items (
            InvoiceItemID INTEGER PRIMARY KEY AUTOINCREMENT,
            InvoiceID INTEGER NOT NULL,
            ItemDescription TEXT NOT NULL,
            BuyersItemIdentification INTEGER NOT NULL,
            SellersItemIdentification INTEGER NOT NULL,
            ItemAmount INTEGER NOT NULL,
            ItemUnitCode TEXT NOT NULL,
            FOREIGN KEY (InvoiceID) REFERENCES invoices(InvoiceID) ON DELETE CASCADE
        );`,

        `CREATE TABLE IF NOT EXISTS users (
            UserID INTEGER PRIMARY KEY AUTOINCREMENT,
            Email TEXT UNIQUE NOT NULL,
            Password TEXT NOT NULL,
            CompanyName TEXT NOT NULL
        );`,

        `CREATE TABLE IF NOT EXISTS sessions (
            SessionID INTEGER PRIMARY KEY AUTOINCREMENT,
            UserID INTEGER NOT NULL,
            NumLogins INTEGER DEFAULT 0 NOT NULL,
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
        );`
    ];

    tables.forEach((sql) => {
        db.run(sql, (err) => {
            if (err) console.error("Error creating table:", err.message);
        });
    });

    return db;
}

// Export Database Connection
const db = await initializeDatabase();
export { db };
