import { db } from './connect.js';
import { CustomInputError } from './errors.js';
import bcrypt from 'bcrypt';

/**
 * Adds a user to the database and initializes their session.
 */
export function userInput(email, password, company, callback) {
    if (!email || !password || !company) {
        return callback(new CustomInputError("Missing required fields."));
    }

    bcrypt.hash(password, 10, async (hashErr, hash) => {
        if (hashErr) {
            console.error("Error hashing password:", hashErr);
            return callback(new CustomInputError("Error processing password."));
        }

        try {
            const userResult = await db.query(
                `INSERT INTO users (Email, Password, CompanyName) VALUES ($1, $2, $3) RETURNING UserID;`,
                [email, hash, company]
            );

            const userID = userResult.rows[0].userid;

            const sessionResult = await db.query(
                `INSERT INTO sessions (UserID) VALUES ($1) RETURNING SessionID;`,
                [userID]
            );

            const sessionID = sessionResult.rows[0].sessionid;
            callback(null, { success: true, message: "User registered.", userID, sessionID });
        } catch (err) {
            console.error("SQL Error:", err.message);
            return callback(new CustomInputError("Database error during user registration."));
        }
    });
}

/**
 * Validates a user's email and password.
 */
export function validateUser(email, password, callback) {
    if (!email || !password) {
        return callback(new CustomInputError("Email and password are required."), false);
    }

    db.query(`SELECT Password FROM users WHERE Email = $1;`, [email])
        .then((result) => {
            if (result.rows.length === 0) return callback(null, false);
            const hashedPassword = result.rows[0].password;
            bcrypt.compare(password, hashedPassword, (compareErr, isMatch) => {
                if (compareErr) {
                    console.error("Error comparing passwords:", compareErr.message);
                    return callback(new CustomInputError("Error processing password validation."), false);
                }
                callback(null, isMatch);
            });
        })
        .catch((err) => {
            console.error("SQL Error while fetching user details:", err.message);
            return callback(new CustomInputError("Database error while validating user."), false);
        });
}

/**
 * Updates the user's session upon login and increments their login count.
 */
export function updateUserSession(email, callback) {
    if (!email) return callback(new CustomInputError("Email is required."));

    db.query(`SELECT UserID FROM users WHERE Email = $1;`, [email])
        .then(async (result) => {
            if (result.rows.length === 0) return callback(new CustomInputError("User not found."));
            const userID = result.rows[0].userid;

            try {
                const sessionRes = await db.query(
                    `INSERT INTO sessions (UserID) VALUES ($1) RETURNING SessionID;`,
                    [userID]
                );
                const sessionID = sessionRes.rows[0].sessionid;

                await db.query(
                    `UPDATE users SET NumLogins = NumLogins + 1 WHERE UserID = $1;`,
                    [userID]
                );

                callback(null, { success: true, message: "New session created.", userID, sessionID });
            } catch (err) {
                console.error("SQL Error during session creation or login count update:", err.message);
                return callback(new CustomInputError("Database error during session creation or login update."));
            }
        })
        .catch((userErr) => {
            console.error("SQL Error while fetching user ID:", userErr.message);
            return callback(new CustomInputError("Database error while fetching user ID."));
        });
}

/**
 * Gets session details for a user given their email.
 */
export function getSessionsByEmail(email, callback) {
    if (!email) return callback(new CustomInputError("Email is required."));

    db.query(`SELECT UserID FROM users WHERE Email = $1;`, [email])
        .then((res1) => {
            if (res1.rows.length === 0) return callback(new CustomInputError("User not found."));
            const userID = res1.rows[0].userid;
            db.query(`SELECT SessionID, CreatedAt FROM sessions WHERE UserID = $1;`, [userID])
                .then((res2) => {
                    if (res2.rows.length === 0) return callback(new CustomInputError("No sessions found for this user."));
                    callback(null, { userID, sessions: res2.rows });
                })
                .catch((sessionErr) => {
                    console.error("SQL Error while fetching sessions:", sessionErr.message);
                    return callback(new CustomInputError("Database error while fetching sessions."));
                });
        })
        .catch((err) => {
            console.error("SQL Error while fetching user by email:", err.message);
            return callback(new CustomInputError("Database error while fetching user."));
        });
}

/**
 * Gets user details based on session ID.
 */
export function getUserBySessionId(sessionId, callback) {
    if (typeof sessionId !== "number") {
        return callback(new CustomInputError("Invalid session ID."));
    }

    db.query(`SELECT UserID FROM sessions WHERE SessionID = $1;`, [sessionId])
        .then((res1) => {
            if (res1.rows.length === 0) return callback(new CustomInputError("Session not found."));
            const userId = res1.rows[0].userid;
            db.query(`SELECT Email, CompanyName FROM users WHERE UserID = $1;`, [userId])
                .then((res2) => {
                    if (res2.rows.length === 0) return callback(new CustomInputError("User not found."));
                    const { email, companyname } = {
                        email: res2.rows[0].email,
                        companyname: res2.rows[0].companyname,
                    };
                    callback(null, { userId, email, company: companyname });
                })
                .catch((userErr) => {
                    console.error("SQL Error while fetching user details:", userErr.message);
                    return callback(new CustomInputError("Database error while fetching user details."));
                });
        })
        .catch((sessionErr) => {
            console.error("SQL Error while fetching session:", sessionErr.message);
            return callback(new CustomInputError("Database error while fetching session."));
        });
}


