import fs from "fs";
import expect from "expect";
import request from "supertest";
import { app } from '../../../app.js';


describe("validateInvoice Function", () => {
    const path = "src/tests/validateTests/xmlInvoiceExamples/";
    const validInvoice = fs.readFileSync(path +"AusInvoice.xml", "utf-8");
    const ublStandardInvoice = fs.readFileSync(path +"ublStandardInvoice.xml", "utf-8");
    const invalidUblTagsInvoice = fs.readFileSync(path +"AusInvoiceInvalidUBL.xml", "utf-8");
    const invalidMissingField = fs.readFileSync(path +"AusInvoiceNoId.xml", "utf-8");
    const notUBL = fs.readFileSync(path +"notUBL.xml", "utf-8");
    
    test("Validate Aus invoice successfully", async () => {
        const res = await request(app).post('/api/v1/invoice/validate')
                                      .set("Content-Type", "application/json")
                                      .send({ invoice: validInvoice })
        expect(res.body).toEqual({ validated: true, message: "Valid invoice" });
        expect(res.status).toEqual(200);
    });

    test("Validate standard UBL invoice successfully", async () => {
        const res = await request(app).post('/api/v1/invoice/validate')
                                      .set("Content-Type", "application/json")
                                      .send({ invoice: ublStandardInvoice })
        expect(res.body).toEqual({ validated: true, message: "Valid invoice" });
        expect(res.status).toEqual(200);
    });

    test("Invalid tags - repeated issue date", async () => {
        const res = await request(app).post('/api/v1/invoice/validate')
                                      .set("Content-Type", "application/json")
                                      .send({ invoice: invalidUblTagsInvoice })
        expect(res.body).toEqual({ validated: false, message: expect.not.stringMatching("Valid invoice") });
        expect(res.status).toEqual(200);
    });

    test("Missing mandatory field - ID", async () => {
        const res = await request(app).post('/api/v1/invoice/validate')
                                      .set("Content-Type", "application/json")
                                      .send({ invoice: invalidMissingField })
        expect(res.body).toEqual({ validated: false, message: expect.not.stringMatching("Valid invoice") });
        expect(res.status).toEqual(200);
    });

    test("Non UBL valid XML", async () => {
        const res = await request(app).post('/api/v1/invoice/validate')
                                      .set("Content-Type", "application/json")
                                      .send({ invoice: notUBL })
        expect(res.body).toEqual({ validated: false, message: expect.not.stringMatching("Valid invoice") });
        expect(res.status).toEqual(200);
    });
});