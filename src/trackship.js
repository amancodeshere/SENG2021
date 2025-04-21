import axios from 'axios';
import { db } from './connect.js';


/**
 * Gets the latest tracking info from TrackShip and updates
 * both the shipment row and its event history.
 *
 * @param {string} trackingNumber
 * @param {string} trackingProvider
 * @returns {Promise<number>} the internal shipments.id
 */
export async function syncShipment(trackingNumber, trackingProvider) {
    const url = 'https://api.trackship.com/v1/shipment/get/';
    const apiKey = process.env.TRACKSHIP_API_KEY;
    const appName = process.env.APP_NAME;

    const resp = await axios.post(
      url,
      { tracking_number: trackingNumber, tracking_provider: trackingProvider },
      {
        headers: {
          'trackship-api-key': apiKey,
          'app-name': appName,
          'Content-Type': 'application/json'
        }
      }
    );
    if (resp.data.status !== 'success') {
      throw new Error(resp.data.message || 'TrackShip API error');
    }
    const d = resp.data.data;

    const upsertShipment = `
    INSERT INTO shipments
      (order_id, tracking_number, tracking_provider, shipping_service, last_event_time,
       est_delivery_date, origin_country, destination_country, delivery_number,
       delivery_provider, tracking_event_status)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (tracking_number) DO UPDATE SET
      order_id = EXCLUDED.order_id,
      shipping_service = EXCLUDED.shipping_service,
      last_event_time = EXCLUDED.last_event_time,
      est_delivery_date = EXCLUDED.est_delivery_date,
      origin_country = EXCLUDED.origin_country,
      destination_country = EXCLUDED.destination_country,
      delivery_number = EXCLUDED.delivery_number,
      delivery_provider = EXCLUDED.delivery_provider,
      tracking_event_status = EXCLUDED.tracking_event_status
    RETURNING id;
  `;

    const { rows } = await db.query(upsertShipment, [
      d.order_id,
      d.tracking_number,
      d.tracking_provider,
      d.shipping_service,
      d.last_event_time,
      d.tracking_est_delivery_date,
      d.origin_country,
      d.destination_country,
      d.delivery_number,
      d.delivery_provider,
      d.tracking_event_status
    ]);

    const shipmentId = rows[0].id;

    await db.query('DELETE FROM shipment_events WHERE shipment_id = $1', [shipmentId]);

    const insertEvent = `
    INSERT INTO shipment_events
      (shipment_id, status, status_detail, message, description, event_time, source,
       location_city, location_state, location_country, location_zip)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
  `;

    for (const ev of d.events || []) {
      await db.query(insertEvent, [
        shipmentId,
        ev.status,
        ev.status_detail,
        ev.message,
        ev.description,
        ev.datetime,
        ev.source,
        ev.tracking_location?.city,
        ev.tracking_location?.state,
        ev.tracking_location?.country,
        ev.tracking_location?.zip
      ]);
    }

    return shipmentId;
}