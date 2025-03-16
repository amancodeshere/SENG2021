import os from 'os';
import { db } from './connect.js';


/**
 * Helper function that calculates the uptime of the service.
 * 
 * @returns {string} The uptime of the service.
 */
export function calcUptime() {
    const uptimeInSecs = os.uptime();
    const hours = Math.floor(uptimeInSecs / 3600);
    const minutes = Math.floor((uptimeInSecs % 3600) / 60);
    return `${hours} hour(s), ${minutes} minutes`;
}

/**
 * Helper function that gets the memory usage of the system in MB.
 * 
 * @returns {string} The memory usage in MB.
 */
export function getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usedMemoryMB = (usedMemory / (1024 *1024)).toFixed(2);
    return `${usedMemoryMB}MB`;
}

/**
 * Health check route for the service.
 * Checks if the database is connected and returns service status.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export function healthCheck(req, res) {
     db.get('SELECT 1', [], (err) => {
        if (err) {
            res.status(500).json({
                status: 'fail',
                errorMessage: 'Database is not connected',
            });
        } else {
            res.status(200).json({
                status: 'success',
                database: 'connected',
                Uptime: calcUptime(),
                memoryUsage: getMemoryUsage(), 
            });
        }
     }); 
};


