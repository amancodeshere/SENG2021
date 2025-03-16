import xsdValidator from 'xsd-schema-validator';
import { validate } from 'schematron-runner';

/**
 * Submits an invoice for validation. Validates that invoice in XML matches UBL formatting and schema.
 * 
 * @param {String} invoice - The XML invoice to validate
 * @param {Function} callback - Callback function to handle the result.
 */
export async function validateInvoice(invoice, callback) {
    try {
        //Validates against the UBL Invoice XSD schema
        await xsdValidator.validateXML(invoice, 'schemas/ubl/xsd/maindoc/UBL-Invoice-2.1.xsd');
        // Validates against the AUNZ-PEPPOL schematron
        await validate(invoice, 'schemas/ANZ-PEPPOL/AUNZ-PEPPOL-validation.sch');
    } catch (err) {
        console.error(err.messages)
        return callback(null, { validated: false, message: err.messages[0]});
    }

    return callback(null, { validated: true, message: "Valid invoice"});

}
