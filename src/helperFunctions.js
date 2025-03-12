/**
 * Validates a party name.
 *
 * @param {string} partyName - party name to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
export function isValidPartyName(partyName) {
    if (typeof partyName !== 'string' || !partyName.trim()) {
        return false;
    }
    const allowedRegex = /^[a-zA-Z0-9\s.,'\-&()]+$/;
    return allowedRegex.test(partyName.trim());
}

/**
 * @returns {number} a random number from a range upto MAX_SAFE_INTEGER
 */
export function randomNumber() {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}
