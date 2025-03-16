import fs from "fs";
import { validateInvoice } from "../validate.js";
import expect from "expect";
import request from "supertest";


describe("validateInvoice Function", () => {
    const path = "src/tests/xmlInvoiceExamples/";
    const validInvoice = fs.readFileSync(path +"AusInvoice.xml", "utf-8");
    const ublStandardInvoice = fs.readFileSync(path +"ublStandardInvoice.xml", "utf-8");
    const invalidUblTagsInvoice = fs.readFileSync(path +"AusInvoiceInvalidUBL.xml", "utf-8");
    const invalidMissingField = fs.readFileSync(path +"AusInvoiceNoId.xml", "utf-8");
    const notUBL = fs.readFileSync(path +"notUBL.xml", "utf-8");
    
    test("Validate Aus invoice successfully", async () => {
        const res = await request(app).get('/api/v1/invoice/validate')
                                      .set("Content-Type", "application/json")
                                      .send({ invoice: validInvoice })
        expect(res.body).toEqual({ validated: true, message: "Valid invoice" });
        expect(res.status).toEqual(200);
        // await validateInvoice(validInvoice, (err, result) => {
        //     expect(err).toBeNull();
        //     expect(result).toEqual({ validated: true, message: "Valid invoice" });
        // });
    });

    test("Validate standard UBL invoice successfully", async () => {
        await validateInvoice(ublStandardInvoice, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ validated: true, message: "Valid invoice" });
        });
    });

    test("Invalid tags - repeated issue date", async () => {
        await validateInvoice(invalidUblTagsInvoice, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ validated: false, message:  expect.not.stringMatching("Valid invoice")});
        });
    });

    test("Missing mandatory field - ID", async () => {
        await validateInvoice(invalidMissingField, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ validated: false, message:  expect.not.stringMatching("Valid invoice")});
        });
    });

    test("Non UBL valid XML", async () => {
        await validateInvoice(notUBL, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ validated: false, message:  expect.not.stringMatching("Valid invoice")});
        });
    });
});