import {
    inputOrder,
    getOrderBySalesOrderID,
    getOrderIdsByPartyName,
    deleteOrderById
} from '../../orderToDB.js';
import { db } from '../../connect.js';
import { CustomInputError } from '../../errors.js';
import { v4 as uuidv4 } from 'uuid';


jest.mock('../../connect.js', () => ({
    db: {
        query: jest.fn(),
    },
}));


describe('ordersToDB.js full test coverage', () => {
    afterEach(() => jest.clearAllMocks());


    const mockSalesOrderId = 'ORD123456';
    const mockOrder = {
        uuid: uuidv4(),
        issuedate: '2024-01-01',
        partynamebuyer: 'Buyer Co',
        partynameseller: 'Seller Co',
        payableamount: 500,
        payablecurrencycode: 'USD',
    };
    const mockItems = [
        {
            ItemDescription: 'Widget A',
            BuyersItemIdentification: '12345678',
            SellersItemIdentification: '87654321',
            ItemAmount: 10,
            ItemUnitCode: 'EA'
        }
    ];


    describe('inputOrder', () => {
        it('should return error if SalesOrderID already exists', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
            await inputOrder(mockSalesOrderId, mockOrder.uuid, mockOrder.issuedate, mockOrder.partynamebuyer, mockOrder.partynameseller, mockOrder.payableamount, mockOrder.payablecurrencycode, mockItems, (err) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/already exists/);
            });
        });


        it('should fail on invalid UUID', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
            await inputOrder(mockSalesOrderId, 'invalid_uuid', mockOrder.issuedate, mockOrder.partynamebuyer, mockOrder.partynameseller, mockOrder.payableamount, mockOrder.payablecurrencycode, mockItems, (err) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/UUID/);
            });
        });


        it('should succeed on valid input', async () => {
            db.query
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({}) // Insert order
                .mockResolvedValueOnce({}) // Insert item
                .mockResolvedValueOnce({}); // COMMIT


            await inputOrder(mockSalesOrderId, mockOrder.uuid, mockOrder.issuedate, mockOrder.partynamebuyer, mockOrder.partynameseller, mockOrder.payableamount, mockOrder.payablecurrencycode, mockItems, (err, res) => {
                expect(err).toBeNull();
                expect(res.success).toBe(true);
            });
        });


        it('should rollback on query failure', async () => {
            db.query
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                .mockRejectedValueOnce(new Error('fail'));


            await inputOrder(mockSalesOrderId, mockOrder.uuid, mockOrder.issuedate, mockOrder.partynamebuyer, mockOrder.partynameseller, mockOrder.payableamount, mockOrder.payablecurrencycode, mockItems, (err) => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/processing order insert/);
            });
        });
    });


    describe('getOrderBySalesOrderID', () => {
        it('should return not found', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });
            await getOrderBySalesOrderID(mockSalesOrderId, err => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/not found/);
            });
        });


        it('should return order', async () => {
            db.query.mockResolvedValueOnce({ rows: [mockOrder] });
            await getOrderBySalesOrderID(mockSalesOrderId, (err, res) => {
                expect(err).toBeNull();
                expect(res).toEqual(mockOrder);
            });
        });


        it('should catch db error', async () => {
            db.query.mockRejectedValueOnce(new Error('fail'));
            await getOrderBySalesOrderID(mockSalesOrderId, err => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/fetching order/);
            });
        });
    });


    describe('getOrderIdsByPartyName', () => {
        it('should return not found', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });
            await getOrderIdsByPartyName('Unknown Co', err => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/No orders/);
            });
        });


        it('should return ids', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ salesorderid: mockSalesOrderId }] });
            await getOrderIdsByPartyName('Buyer Co', (err, res) => {
                expect(err).toBeNull();
                expect(res).toEqual([mockSalesOrderId]);
            });
        });


        it('should catch db error', async () => {
            db.query.mockRejectedValueOnce(new Error('fail'));
            await getOrderIdsByPartyName('Buyer Co', err => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/fetching order IDs/);
            });
        });
    });


    describe('deleteOrderById', () => {
        it('should fail on db error', async () => {
            db.query.mockRejectedValueOnce(new Error('fail'));
            await deleteOrderById(mockSalesOrderId, err => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch(/delete transaction/);
            });
        });


        it('should rollback if order not found', async () => {
            db.query
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ rowCount: 0 })
                .mockResolvedValueOnce({});
            await deleteOrderById(mockSalesOrderId, err => {
                expect(err).toBeInstanceOf(CustomInputError);
                expect(err.message).toMatch("Error committing delete transaction.");
            });
        });


        it('should succeed', async () => {
            db.query
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ rowCount: 1 })
                .mockResolvedValueOnce({});
            await deleteOrderById(mockSalesOrderId, (err, res) => {
                expect(err).toBeNull();
                expect(res).toHaveProperty('success', true);
            });
        });
    });
});