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

            const sqlSessionInsert = `INSERT INTO sessions (UserID, NumLogins) VALUES (?, 1);`;
            db.run(sqlSessionInsert, [userID], function (sessionErr) {
                if (sessionErr) {
                    console.error("SQL Error while creating session:", sessionErr.message);
                    return callback(new CustomInputError("Database error while creating session."));
                }

                const sessionID = this.lastID; // get inserted SessionID
                callback(null, { success: true, message: "User registered.", userID, sessionID });
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
 * Updates the user's session upon successful login.
 *
 * @param {string} email - The email of the user logging in.
 * @param {function} callback - The callback function to handle results.
 */
export function updateUserSession(email, callback) {
    if (!email) {
        return callback(new Error("Email is required."));
    }

    // get the User ID given email
    const sqlGetUserID = `SELECT UserID FROM users WHERE Email = ?;`;
    db.get(sqlGetUserID, [email], (userErr, userRow) => {
        if (userErr) {
            console.error("SQL Error while fetching user ID:", userErr.message);
            return callback(new Error("Database error while fetching user ID."));
        }

        if (!userRow) return callback(new Error("User not found."));

        const userID = userRow.UserID;

        // mmake a new session for user
        const sqlInsertSession = `
            INSERT INTO sessions (UserID, NumLogins)
            VALUES (?, 1);
        `;
        db.run(sqlInsertSession, [userID], function (insertErr) {
            if (insertErr) {
                console.error("SQL Error while creating session:", insertErr.message);
                return callback(new Error("Database error while creating session."));
            }

            // get the last session ID
            const sessionID = this.lastID;
            callback(null, { success: true, message: "New session created.", userID, sessionID });
        });
    });
}


/**
 * Gets session details for a user given their email.
 *
 * @param {string} email - The user's email address.
 * @param {function} callback - Callback function to handle the result.
 */
export function getSessionsByEmail(email, callback) {
    if (!email) {
        return callback(new CustomInputError("Email is required."));
    }

    // get UserID using Email
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

        // get all sessions for the found UserID
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


/**
 * Gets user details based on session ID.
 *
 * @param {number} sessionId - The session ID.
 * @param {function} callback - Callback to return user details.
 */
export function getUserBySessionId(sessionId, callback) {
    if (typeof sessionId !== "number") {
        return callback(new CustomInputError("Invalid session ID."));
    }

    // userID from sessions table
    const sqlGetUserId = `SELECT UserID FROM sessions WHERE SessionID = ?;`;

    db.get(sqlGetUserId, [sessionId], (sessionErr, sessionRow) => {
        if (sessionErr) {
            console.error("SQL Error while fetching session:", sessionErr.message);
            return callback(new CustomInputError("Database error while fetching session."));
        }

        if (!sessionRow) {
            return callback(new CustomInputError("Session not found."));
        }

        const userId = sessionRow.UserID;

        const sqlGetUserDetails = `
            SELECT Email, CompanyName 
            FROM users 
            WHERE UserID = ?;
        `;

        db.get(sqlGetUserDetails, [userId], (userErr, userRow) => {
            if (userErr) {
                console.error("SQL Error while fetching user details:", userErr.message);
                return callback(new CustomInputError("Database error while fetching user details."));
            }

            if (!userRow) {
                return callback(new CustomInputError("User not found."));
            }

            // user details
            callback(null, { userId, email: userRow.Email, company: userRow.CompanyName });
        });
    });
}