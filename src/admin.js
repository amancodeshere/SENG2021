import { isValidPartyName } from './helperFunctions.js';
import validator from 'validator';
import { CustomInputError } from './errors.js';
import { userInput, getSessionsByEmail } from './UsersToDB.js';

// global constants
const MIN_BUSINESS_NAME_LENGTH = 2;
const MIN_PASSWORD_LENGTH = 8;

// ===========================================================================
// ============== local helper functions only used in admin.js ===============
// ===========================================================================

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

// ===========================================================================
// ============================ main functions ===============================
// ===========================================================================
/**
 * @description Creates a user resource in the database with given details and
 * return a sessionId to authorise the user.
 * @param {string} companyName 
 * @param {string} email 
 * @param {string} password 
 * @returns {{ sessionId: number }}
 */
export function adminRegister(email, password, comapanyName, callback) {
    if (!validator.isEmail(email)) {
        return callback(new CustomInputError("This email is not a valid email address."));
    }

    if(!isValidPartyName(comapanyName)) {
        return callback(new CustomInputError("comapanyName contains invalid characters."));
    }

    if (comapanyName.length < MIN_BUSINESS_NAME_LENGTH) {
        return callback(new CustomInputError("comapanyName must be 2 or more characters in length."));
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        return callback(new CustomInputError("Password must be atleast 8 characters."));
    }
    
    if (!passwordErrorCheck(password)) {
        return callback(new CustomInputError("Password must contain atleast one letter and number."));
    }

    userInput(email, password, comapanyName, (userErr, userResult) => {
        if (userErr) {
            return callback(userErr);
        }

        // Fetch session details using getSessionsByEmail
        getSessionsByEmail(email, (sessionErr, sessionResult) => {
            if (sessionErr) {
                return callback(sessionErr);
            }

            console.log(sessionResult);

            // New session created upon registration is at index 0
            const newSession = sessionResult.sessions[0];

            callback(null, {
                userId: userResult.userID,
                sessionId: newSession.SessionID
            });
        });
    });
}
