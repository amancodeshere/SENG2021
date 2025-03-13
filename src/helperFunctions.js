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
