import xsdValidator from 'xsd-schema-validator';
import schValidator from 'schematron-runner';
import { CustomInputError } from './errors';

/**
 * Submits an invoice for validation. Validates that invoice in XML matches UBL formatting and schema.
 * 
 * @param {String} invoice - The XML invoice to validate
 * @param {Function} callback - Callback function to handle the result.
 */
export async function validateInvoice(invoice, callback) {
    try {
        // Validates against the UBL Invoice XSD schema
        const xsdResult = await xsdValidator.validateXML(invoice, 'schemas/ubl/xsd/maindoc/UBL-Invoice-2.1.xsd');
        if (!xsdResult.valid) {
            return callback(null, { validated: false, message: xsdResult.messages});
        }

        // Validates against the AUNZ-PEPPOL schematron
        const schResult = await schValidator.validate(invoice, 'schemas/ANZ-PEPPOL/AUNZ-PEPPOL-validation.sch');
        if (schResult.errors.length != 0) {
            var message = "";
            schResult.errors.forEach(error => {message += error.xml + "\n";});
            return callback(null, { validated: false, message: message});
        }

        return callback(null, { validated: true, message: ""});
    } catch (error) {
        console.error("Error validating invoice: ", error);
        return callback(new CustomInputError("Error validating invoice"));
    }
}
