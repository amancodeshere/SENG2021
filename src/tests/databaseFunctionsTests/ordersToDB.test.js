import {
    inputOrder,
    getOrderBySalesOrderID,
    getOrderIdsByPartyName,
    deleteOrderById
} from '../../orderToDB.js';
import { db } from '../../connect.js';
import { CustomInputError } from '../../errors.js';

jest.mock('../../connect.js', () => ({
    db: {
        query: jest.fn(),
    },
}));

describe('ordersToDB.js test', () => {
    afterEach(() => jest.clearAllMocks());

    const mockSalesOrderId = 'SO123';
    const mockOrder = {
        salesorderid: mockSalesOrderId,
        uuid: '11111111-1111-1111-1111-111111111111',
        issuedate: '2025-01-01',
        partynamebuyer: 'Test Corp',
        partynameseller: 'Test Corp',
        payableamount: 1000,
        payablecurrencycode: 'USD',
    };
    const mockItems = [
        {
            ItemDescription: 'Widget',
            BuyersItemIdentification: '12345678',
            SellersItemIdentification: '87654321',
            ItemAmount: 5,
            ItemUnitCode: 'EA'
        }
    ];

    describe('inputOrder', () => {
        it('should return error if SalesOrderID already exists', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
            await inputOrder(mockSalesOrderId, mockOrder.uuid, mockOrder.issuedate, mockOrder.partynamebuyer, mockOrder.payableamount, mockOrder.payablecurrencycode, mockItems, (err) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/already exists/);
            });
        });

        it('should fail on invalid UUID', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
            await inputOrder(mockSalesOrderId, 'invalid', mockOrder.issuedate, mockOrder.partynamebuyer, mockOrder.payableamount, mockOrder.payablecurrencycode, mockItems, (err) => {
                expect(err.message).toMatch(/Invalid UUID/);
            });
        });

        it('should fail on invalid item data', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
            const invalidItems = [{ ...mockItems[0], ItemAmount: -1 }];
            await inputOrder(mockSalesOrderId, mockOrder.uuid, mockOrder.issuedate, mockOrder.partynamebuyer, mockOrder.payableamount, mockOrder.payablecurrencycode, invalidItems, (err) => {
                expect(err.message).toMatch("Error processing order insert.");
            });
        });

        it('should succeed on valid input', async () => {
            db.query
                .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // order check
                .mockResolvedValue({}); // all others

            await inputOrder(mockSalesOrderId, mockOrder.uuid, mockOrder.issuedate, mockOrder.partynamebuyer, mockOrder.payableamount, mockOrder.payablecurrencycode, mockItems, (err, res) => {
                expect(err).toBeNull();
                expect(res.success).toBe(true);
            });
        });

        it('should rollback on query failure', async () => {
            db.query
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                .mockRejectedValueOnce(new Error('fail'));
            await inputOrder(mockSalesOrderId, mockOrder.uuid, mockOrder.issuedate, mockOrder.partynamebuyer, mockOrder.payableamount, mockOrder.payablecurrencycode, mockItems, (err) => {
                expect(err.message).toMatch(/processing order insert/);
            });
        });
    });

    describe('getOrderBySalesOrderID', () => {
        it('should return not found', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });
            await getOrderBySalesOrderID(mockSalesOrderId, (err) => {
                expect(err.message).toMatch(/not found/);
            });
        });

        it('should return order', async () => {
            db.query.mockResolvedValueOnce({ rows: [mockOrder] });
            await getOrderBySalesOrderID(mockSalesOrderId, (err, row) => {
                expect(err).toBeNull();
                expect(row).toHaveProperty('salesorderid');
            });
        });

        it('should catch db error', async () => {
            db.query.mockRejectedValueOnce(new Error('fail'));
            await getOrderBySalesOrderID(mockSalesOrderId, (err) => {
                expect(err.message).toMatch(/fetching order/);
            });
        });
    });

    describe('getOrderIdsByPartyName', () => {
        it('should return not found', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });
            await getOrderIdsByPartyName('Missing', (err) => {
                expect(err.message).toMatch(/No orders/);
            });
        });

        it('should return ids', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ salesorderid: mockSalesOrderId }] });
            await getOrderIdsByPartyName(mockOrder.partynamebuyer, (err, rows) => {
                expect(err).toBeNull();
                expect(rows).toContain(mockSalesOrderId);
            });
        });

        it('should catch db error', async () => {
            db.query.mockRejectedValueOnce(new Error('fail'));
            await getOrderIdsByPartyName(mockOrder.partynamebuyer, (err) => {
                expect(err.message).toMatch(/fetching order IDs/);
            });
        });
    });

    describe('deleteOrderById', () => {
        it('should fail on db error', async () => {
            db.query.mockRejectedValueOnce(new Error('fail'));
            await deleteOrderById(mockSalesOrderId, (err) => {
                expect(err.message).toMatch(/delete transaction/);
            });
        });

        it('should rollback if order not found', async () => {
            db.query
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ rowCount: 0 })
                .mockResolvedValue({});
            await deleteOrderById(mockSalesOrderId, (err) => {
                expect(err.message).toMatch("Error committing delete transaction.");
            });
        });

        it('should succeed', async () => {
            db.query
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ rowCount: 1 })
                .mockResolvedValue({});
            await deleteOrderById(mockSalesOrderId, (err, res) => {
                expect(err).toBeNull();
                expect(res).toHaveProperty('success', true);
            });
        });
    });
});


