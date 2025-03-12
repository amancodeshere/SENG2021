export class CustomInputError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, CustomInputError.prototype);
    }
}