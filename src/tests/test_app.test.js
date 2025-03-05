/* eslint-disable */
const { add, isEven } = require("../test_app");

describe("Utility Function Tests", () => {
    test("adds two numbers correctly", () => {
        expect(add(2, 3)).toBe(5);
        expect(add(-1, 1)).toBe(0);
    });

    test("checks if a number is even", () => {
        expect(isEven(4)).toBe(true);
        expect(isEven(7)).toBe(false);
    });
});
