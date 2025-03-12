import request from 'sync-request-curl';
import { PORT, HOST } from './server.js';

const SERVER_URL = ` http://${HOST}:${PORT}`; 
const TIMEOUT_MS = 5 * 1000;

// Helper functions for making requests to the server in tests
export const getRequest = (route, query) => {
    const res = request(
      'GET',
      SERVER_URL + route,
      {
        qs: query,
        timeout: TIMEOUT_MS,
      }
    );
    return {
      statusCode: res.statusCode,
      response: JSON.parse(res.body.toString()),
    };
};

export const deleteRequest = (route, query) => {
    const res = request(
      'DELETE',
      SERVER_URL + route,
      {
        qs: query,
        timeout: TIMEOUT_MS,
      }
    );
    return {
      statusCode: res.statusCode,
      response: JSON.parse(res.body.toString()),
    };
};
  
export const postRequest = (route, body) => {
    const res = request(
      'POST',
      SERVER_URL + route,
      {
        json: body,
        timeout: TIMEOUT_MS,
      }
    );
    return {
      statusCode: res.statusCode,
      response: JSON.parse(res.body.toString()),
    };
};

export const putRequest = (route, body) => {
    const res = request(
      'PUT',
      SERVER_URL + route,
      {
        json: body,
        timeout: TIMEOUT_MS,
      }
    );
    return {
      statusCode: res.statusCode,
      response: JSON.parse(res.body.toString()),
    };
};
