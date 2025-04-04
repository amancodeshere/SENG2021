// tests/invoiceToDB.test.js
import {
    inputInvoice,
    getInvoiceByID,
    getInvoicesByCompanyName,
    deleteInvoiceById
} from '../../invoiceToDB.js';
import { db } from '../../connect.js';
import { CustomInputError } from '../../errors.js';

jest.mock('../../connect.js', () => ({
    db: {
        query: jest.fn(),
    },
}));

describe('invoiceToDB module tests', () => {
    afterEach(() => jest.clearAllMocks());

    const salesOrderId = 'ORD123';
    const mockOrderRow = {
        issuedate: '2025-01-01',
        partynamebuyer: 'Buyer Pty',
        partynameseller: 'Seller Co',
        payableamount: 1000,
        currencycode: 'USD'
    };

    const mockInvoiceRow = {
        invoiceid: 1,
        issuedate: '2025-01-01',
        partynamebuyer: 'Buyer Pty',
        partynameseller: 'Seller Co',
        payableamount: 1000,
        currencycode: 'USD',
        salesorderid: salesOrderId
    };

    const mockItemRows = [
        {
            itemdescription: 'Item A',
            buyersitemidentification: 1,
            sellersitemidentification: 2,
            itemamount: 10,
            itemunitcode: 'EA'
        }
    ];

    describe('inputInvoice', () => {
        it('should insert invoice and items successfully', async () => {
            db.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [mockOrderRow] })
                .mockResolvedValueOnce({ rows: [{ invoiceid: 1 }] })
                .mockResolvedValueOnce({ rows: mockItemRows })
                .mockResolvedValueOnce({}) // insert item
                .mockResolvedValueOnce({}); // COMMIT

            await inputInvoice(salesOrderId, (err, res) => {
                expect(err).toBeNull();
                expect(res).toHaveProperty('success', true);
                expect(res).toHaveProperty('InvoiceID', 1);
            });
        });

        it('should handle order not found', async () => {
            db.query
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValue({});

            await inputInvoice(salesOrderId, (err) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/Order not found/);
            });
        });

        it('should handle insert item error', async () => {
            db.query
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ rows: [mockOrderRow] })
                .mockResolvedValueOnce({ rows: [{ invoiceid: 1 }] })
                .mockResolvedValueOnce({ rows: mockItemRows })
                .mockRejectedValueOnce(new Error('item insert error'))
                .mockResolvedValueOnce({}); // ROLLBACK

            await inputInvoice(salesOrderId, (err) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/invoice creation/);
            });
        });
    });

    describe('getInvoiceByID', () => {
        it('should return full invoice with items', async () => {
            db.query
                .mockResolvedValueOnce({ rows: [mockInvoiceRow] })
                .mockResolvedValueOnce({ rows: mockItemRows });

            await getInvoiceByID(1, (err, invoice) => {
                expect(err).toBeNull();
                expect(invoice).toHaveProperty('invoiceid', 1);
                expect(invoice.Items).toHaveLength(1);
            });
        });

        it('should handle missing invoice', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });

            await getInvoiceByID(1, (err) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/Invoice not found/);
            });
        });
    });

    describe('getInvoicesByCompanyName', () => {
        it('should return invoices for a buyer', async () => {
            db.query.mockResolvedValueOnce({ rows: [mockInvoiceRow] });

            await getInvoicesByCompanyName('Buyer Pty', (err, rows) => {
                expect(err).toBeNull();
                expect(rows).toHaveLength(1);
            });
        });

        it('should handle no invoices found', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });

            await getInvoicesByCompanyName('Buyer Pty', (err) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/No invoices found/);
            });
        });

        it('should handle DB error', async () => {
            db.query.mockRejectedValueOnce(new Error('query error'));

            await getInvoicesByCompanyName('Buyer Pty', (err) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/Database error/);
            });
        });
    });

    describe('deleteInvoiceById', () => {
        it('should delete invoice and items successfully', async () => {
            db.query
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ rowCount: 1 })
                .mockResolvedValueOnce({});

            await deleteInvoiceById(1, (err, res) => {
                expect(err).toBeNull();
                expect(res).toHaveProperty('success', true);
            });
        });

        it('should handle missing invoice during delete', async () => {
            db.query
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ rowCount: 0 })
                .mockResolvedValue({});

            await deleteInvoiceById(1, (err) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/Invoice not found/);
            });
        });

        it('should handle delete failure', async () => {
            db.query.mockRejectedValueOnce(new Error('delete failed'));

            await deleteInvoiceById(1, (err) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/invoice deletion/);
            });
        });
    });
});
