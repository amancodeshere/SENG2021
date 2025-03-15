import xsdValidator from 'xsd-schema-validator';
import validator from 'schematron-runner'

async function validate_invoice() {
    try {
      const result = await xsdValidator.validateXML({ file: 'schemas/ubl/xml/AU Invoice Energy Bill Example_1.xml' }, 'schemas/ubl/xsd/maindoc/UBL-Invoice-2.1.xsd');
      console.log(result.valid);

      // const other_result = await validator.validate('schemas/ubl/xml/AU Invoice Energy Bill Example_1.xml', 'schemas/ANZ-PEPPOL/AUNZ-UBL-validation.sch');
      // conslole.log(other_result);

      const results = await validator.validate('schemas/ubl/xml/AU Invoice Energy Bill Example_1.xml', 'schemas/ANZ-PEPPOL/AUNZ-PEPPOL-validation.sch');
      console.log(results);

      

    } catch (err) {
      console.error(err);
    }
}


validate_invoice();