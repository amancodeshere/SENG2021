import fs from "fs";
import { validateInvoice } from "../validate.js";

describe("validateInvoice Function", () => {
    const validInvoice = fs.readFileSync("src/tests/xmlInvoiceExamples/AusInvoice.xml", "utf-8");
    const ublStandardInvoice = fs.readFileSync("src/tests/xmlInvoiceExamples/ublStandardInvoice.xml", "utf-8");

    test("Validate invoice successfully", async () => {
        await validateInvoice(validInvoice, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ validated: true, message: "Valid invoice" });
        });
    })
});