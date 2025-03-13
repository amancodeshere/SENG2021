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

/**
 * Validates a user's email and password against the database.
 *
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @param {function} callback - The callback function to handle results.
 */
export function validateUser(email, password, callback) {
    if (!email || !password) {
        return callback(new Error("Email and password are required."), false);
    }

    const sqlQuery = `SELECT Password FROM users WHERE Email = ?;`;

    db.get(sqlQuery, [email], (err, row) => {
        if (err) {
            console.error("SQL Error while fetching user details:", err.message);
            return callback(new Error("Database error while validating user."), false);
        }

        if (!row) {
            return callback(null, false); // not found
        }

        // compare hashed password
        bcrypt.compare(password, row.Password, (compareErr, isMatch) => {
            if (compareErr) {
                console.error("Error comparing passwords:", compareErr.message);
                return callback(new Error("Error processing password validation."), false);
            }
            callback(null, isMatch);
        });
    });
}

/**
 * Updates the user's session count upon successful login.
 *
 * @param {number} userId - The ID of the user logging in.
 * @param {function} callback - The callback function to handle results.
 */
export function updateUserSession(userId, callback) {
    if (!userId) {
        return callback(new Error("User ID is required."));
    }

    // Check if the user already has a session entry
    const sqlCheckSession = `SELECT NumLogins FROM sessions WHERE UserID = ?;`;

    db.get(sqlCheckSession, [userId], (err, row) => {
        if (err) {
            console.error("SQL Error while checking session:", err.message);
            return callback(new Error("Database error while checking session."));
        }

        if (!row) {
            // If session doesn't exist, create one
            const sqlInsertSession = `INSERT INTO sessions (UserID, NumLogins) VALUES (?, 1);`;
            db.run(sqlInsertSession, [userId], function (insertErr) {
                if (insertErr) {
                    console.error("SQL Error while creating session:", insertErr.message);
                    return callback(new Error("Database error while creating session."));
                }
                callback(null, { success: true, message: "Session initialized." });
            });
        } else {
            // If session exists, increment NumLogins
            const sqlUpdateSession = `UPDATE sessions SET NumLogins = NumLogins + 1 WHERE UserID = ?;`;
            db.run(sqlUpdateSession, [userId], function (updateErr) {
                if (updateErr) {
                    console.error("SQL Error while updating session:", updateErr.message);
                    return callback(new Error("Database error while updating session."));
                }
                callback(null, { success: true, message: "Session updated successfully." });
            });
        }
    });
}

/**
 * Retrieves session details for a user given their email.
 *
 * @param {string} email - The user's email address.
 * @param {function} callback - Callback function to handle the result.
 */
export function getSessionsByEmail(email, callback) {
    if (!email) {
        return callback(new CustomInputError("Email is required."));
    }

    // First query: Get UserID by Email
    const sqlGetUserID = `SELECT UserID FROM users WHERE Email = ?;`;
    db.get(sqlGetUserID, [email], (err, userRow) => {
        if (err) {
            console.error("SQL Error while fetching user by email:", err.message);
            return callback(new CustomInputError("Database error while fetching user."));
        }

        if (!userRow) {
            return callback(new CustomInputError("User not found."));
        }

        const userID = userRow.UserID;

        // Second query: Get all sessions for the found UserID
        const sqlGetSessions = `SELECT SessionID, CreatedAt FROM sessions WHERE UserID = ?;`;
        db.all(sqlGetSessions, [userID], (sessionErr, sessionRows) => {
            if (sessionErr) {
                console.error("SQL Error while fetching sessions:", sessionErr.message);
                return callback(new CustomInputError("Database error while fetching sessions."));
            }

            if (!sessionRows || sessionRows.length === 0) {
                return callback(new CustomInputError("No sessions found for this user."));
            }

            callback(null, { userID, sessions: sessionRows });
        });
    });
}