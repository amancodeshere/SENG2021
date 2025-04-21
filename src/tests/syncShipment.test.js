import request from 'supertest';
import { app } from '../app.js';
import { syncShipment } from '../trackship.js';


jest.mock('../trackship.js', () => ({
  syncShipment: jest.fn(),
}));


beforeEach(() => {
  jest.clearAllMocks();
});


describe('POST /api/v2/shipment/sync', () => {
  const endpoint = '/api/v2/shipment/sync';


  it('should return 200 and the new shipmentId when sync succeeds', async () => {
    syncShipment.mockResolvedValueOnce(42);


    const res = await request(app)
      .post(endpoint)
      .set('Content-Type', 'application/json')
      .send({
        trackingNumber: 'TN12345',
        trackingProvider: 'delhivery',
      });


    expect(res.status).toBe(200);
    expect(res.body).toEqual({ shipmentId: 42 });
    expect(syncShipment).toHaveBeenCalledWith('TN12345', 'delhivery');
  });


  it('should return 400 if neither trackingNumber nor trackingProvider is provided', async () => {
    const res = await request(app)
      .post(endpoint)
      .set('Content-Type', 'application/json')
      .send({});


    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'trackingNumber and trackingProvider are required'
    });
    expect(syncShipment).not.toHaveBeenCalled();
  });


  it('should return 400 if trackingNumber is missing', async () => {
    const res = await request(app)
      .post(endpoint)
      .set('Content-Type', 'application/json')
      .send({ trackingProvider: 'delhivery' });


    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'trackingNumber and trackingProvider are required'
    });
    expect(syncShipment).not.toHaveBeenCalled();
  });


  it('should return 400 if trackingProvider is missing', async () => {
    const res = await request(app)
      .post(endpoint)
      .set('Content-Type', 'application/json')
      .send({ trackingNumber: 'TN12345' });


    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'trackingNumber and trackingProvider are required'
    });
    expect(syncShipment).not.toHaveBeenCalled();
  });


  it('should return 500 if syncShipment throws an error', async () => {
    syncShipment.mockRejectedValueOnce(new Error('API unreachable'));


    const res = await request(app)
      .post(endpoint)
      .set('Content-Type', 'application/json')
      .send({
        trackingNumber: 'TN12345',
        trackingProvider: 'delhivery',
      });


    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to sync shipment' });
    expect(syncShipment).toHaveBeenCalledWith('TN12345', 'delhivery');
  });
});



