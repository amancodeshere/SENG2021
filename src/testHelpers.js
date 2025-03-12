import request from 'sync-request-curl';
import { PORT, HOST } from './server.js';

const SERVER_URL = ` http://${HOST}:${PORT}`; 
const TIMEOUT_MS = 5 * 1000;

// Helper functions for making requests to the server in tests
export function getRequest(route, query, headers) {
    const res = request(
      'GET',
      SERVER_URL + route,
      {
        qs: query,
        headers: headers,
        timeout: TIMEOUT_MS,
      }
    );
    return {
      statusCode: res.statusCode,
      response: JSON.parse(res.body.toString()),
    };
}

export function deleteRequest(route, query, headers) {
    const res = request(
      'DELETE',
      SERVER_URL + route,
      {
        qs: query,
        headers: headers,
        timeout: TIMEOUT_MS,
      }
    );
    return {
      statusCode: res.statusCode,
      response: JSON.parse(res.body.toString()),
    };
}
  
export function postRequest(route, body, headers) {
    const res = request(
      'POST',
      SERVER_URL + route,
      {
        json: body,
        headers: headers,
        timeout: TIMEOUT_MS,
      }
    );
    return {
      statusCode: res.statusCode,
      response: JSON.parse(res.body.toString()),
    };
}

export function putRequest(route, body, headers) {
    const res = request(
      'PUT',
      SERVER_URL + route,
      {
        json: body,
        headers: headers,
        timeout: TIMEOUT_MS,
      }
    );
    return {
      statusCode: res.statusCode,
      response: JSON.parse(res.body.toString()),
    };
}
