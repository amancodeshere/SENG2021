import { isValidPartyName, randomNumber } from './helperFunctions.js';
import validator from 'validator';
import crypto from 'crypto';

// global constants
const MIN_BUSINESS_NAME_LENGTH = 2;
const MIN_PASSWORD_LENGTH = 8;

// ===========================================================================
// ============== local helper functions only used in admin.js ===============
// ===========================================================================
/**
 * @param {Array<{
*   userId: number,
*   businessName: string,
*   email: string,
*   password: string,
*   sessions: Array<number>
* }>} users array of user objects
* @param {string} email
* @returns {{
*   userId: number,
*   businessName: string,
*   email: string,
*   passwords: Array<number>,
*   sessions: Array<number>
* } | undefined } undefined if email does not match any existing user,
* the user object otherwise.
*/
function getUserFromEmail(users, email) {
    return users.find((user) => user.email === email);
};

/**
 * @param {Array<{
*   userId: number,
*   businessName: string,
*   email: string,
*   password: string,
*   sessions: Array<number>
* }>} users array of user objects
* @param {string} businessName
* @returns {{
*   userId: number,
*   businessName: string,
*   email: string,
*   passwords: Array<number>,
*   sessions: Array<number>
* } | undefined } undefined if businessName does not match any existing user,
* the user object otherwise.
*/
function getUserFromBusinessName(users, businessName) {
    return users.find((user) => user.businessName === businessName);
};

/**
 * @param {Array<{
*   userId: number,
*   businessName: string,
*   email: string,
*   password: string,
* }>} users array of user objects
* @param {number} userId
* @returns {{
*   userId: number,
*   businessName: string,
*   email: string,
*   passwords: Array<number>,
* } | undefined } undefined if userId does not match any existing user,
* the user object otherwise.
*/
function getUserFromUserId(users, userId) {
    return users.find((user) => user.userId === userId);
};

/**
 * @param {Array<{
 *  sessionId: number
*   userId: number,
* }>} users array of user objects
* @param {number} sessionId
* @returns {{
 *  sessionId: number
    *   userId: number,
    * } | undefined } undefined if sessionId does not match any existing session,
* the session object otherwise.
*/
function getSessionFromSessionId(sessions, sessionId) {
    return sessions.find((session) => session.sessionId === sessionId);
};

/**
 * @param {string} password
 * @returns {boolean} false if password has both a number and letter and passes the error
 * check, true otherwise
 */
function passwordErrorCheck(password) {
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);

    return hasNumber && hasLetter;
};

/**
 * @param {string} password
 * @returns {string} hashed password
 */
function hashPassword(password) {
    // create a hash object for the SHA-256 hashing algorithm
    const hash = crypto.createHash('sha256');
    // add password to the hash object for hashing
    hash.update(password);
    // complete the hashing process and get the final hashed output
    return hash.digest('hex');
};


// ===========================================================================
// ============================ main functions ===============================
// ===========================================================================
/**
 * @description Creates a user resource in the database with given details and
 * return a sessionId to authorise the user.
 * @param {string} businessName 
 * @param {string} email 
 * @param {string} password 
 * @returns {{ sessionId: number }}
 */
export function adminRegister(businessName, email, password) {
    if (getUserFromEmail(data.users, email) !== undefined) {
        throw new Error("This email is already registered.");
    }

    if (getUserFromBusinessName(data.users, businessName) !== undefined) {
        throw new Error("This businessName is already registered.");
    }

    if (!validator.isEmail(email)) {
        throw new Error("This email is not a valid email address.");
    }

    if(!isValidPartyName(businessName)) {
        throw new Error("businessName contains invalid characters.");
    }

    if (businessName.length < MIN_BUSINESS_NAME_LENGTH) {
        throw new Error("businessName must be 2 or more characters in length.");
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error("Password must be atleast 8 characters");
    }
    
    if (!passwordErrorCheck(password)) {
        throw new Error("Password must contain atleast one letter and number");
    }
    
    // create unqiue userId
    let userId = randomNumber();
    while (getUserFromUserId(data.users, userId) !== undefined) {
        userId = randomNumber();
    }

    // create unqiue sessionId
    let sessionId = randomNumber();
    while (getSessionFromSessionId(data.sessions, sessionId) !== undefined) {
        sessionId = randomNumber();
    }

    password = hashPassword(password);

    // add user details
    const user = {
        userId: userId,
        businessName: businessName,
        email: email,
        password: password,
    };
    data.users.push(user);

    // add user session
    const session = {
        sessionId: sessionId,
        userId: userId
    };
    data.sessions.push(session);
    
    return {
        sessionId
    }
}