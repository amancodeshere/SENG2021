import validator from 'xsd-schema-validator';

async function validate_invoice() {
    try {
      const result = await validator.validateXML({ file: 'ubl/xml/AU Invoice Energy Bill Example_1.xml' }, 'ubl/xsd/maindoc/UBL-Invoice-2.1.xsd');
      console.log(result.valid);
    } catch (err) {
      console.error("validation error");
    }
}
