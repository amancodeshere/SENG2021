import { db } from './connect.js';
import { CustomInputError } from './errors.js';
import bcrypt from 'bcrypt';

/**
 * Adds a user to the database and initializes their session.
 *
 * @param {string} email - The user's email.
 * @param {string} password - The user's password (to be hashed later).
 * @param {string} company - The company the user works for.
 * @param {function} callback - The callback function to handle results.
 */
export function userInput(email, password, company, callback) {
    if (!email || !password || !company) {
        return callback(new CustomInputError("Missing required fields."));
    }

    bcrypt.hash(password, 10, (hashErr, hash) => {
        if (hashErr) {
            console.error("Error hashing password:", hashErr);
            return callback(new CustomInputError("Error processing password."));
        }
        const sqlUserInsert = `INSERT INTO users (Email, Password, CompanyName) VALUES (?, ?, ?);`;

        db.run(sqlUserInsert, [email, hash, company], function (err) {
            if (err) {
                console.error("SQL Error while inserting user:", err.message);
                return callback(new CustomInputError("Database error while inserting user."));
            }

            const userID = this.lastID;

            // Initialize session for the user
            const sqlSessionInsert = `INSERT INTO sessions (UserID, NumLogins) VALUES (?, 1);`;
            db.run(sqlSessionInsert, [userID], function (sessionErr) {
                if (sessionErr) {
                    console.error("SQL Error while creating session:", sessionErr.message);
                    return callback(new CustomInputError("Database error while creating session."));
                }
                callback(null, { success: true, message: "User registered.", userID });
            });
        });
    });
}
