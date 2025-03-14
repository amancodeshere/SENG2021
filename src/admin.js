import { isValidPartyName } from './helperFunctions.js';
import validator from 'validator';
import { CustomInputError } from './errors.js';
import { userInput } from './UsersToDB.js';

// global constants
const MIN_BUSINESS_NAME_LENGTH = 3;
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
export function adminRegister(email, password, companyName, callback) {
    if (!validator.isEmail(email)) {
        return callback(new CustomInputError("This email is not a valid email address."));
    }

    if(!isValidPartyName(companyName)) {
        return callback(new CustomInputError("comapanyName contains invalid characters."));
    }

    if (companyName.length < MIN_BUSINESS_NAME_LENGTH) {
        return callback(new CustomInputError("comapanyName must be 2 or more characters in length."));
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        return callback(new CustomInputError("Password must be atleast 8 characters."));
    }
    
    if (!passwordErrorCheck(password)) {
        return callback(new CustomInputError("Password must contain atleast one letter and number."));
    }

    userInput(email, password, companyName, (err, result) => {
        if (err) {
            return callback(err);
        }

        callback(null, {
            sessionId: result.sessionID
        });
    });
}
