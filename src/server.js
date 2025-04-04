import { app } from './app.js';

const PORT = process.env.PORT || 3000;  // Ensure Railway assigns this dynamically
const HOST = '0.0.0.0';  // Must bind to all interfaces for Railway

const server = app.listen(PORT, HOST, () => {
    console.log(` Server is running on http://${HOST}:${PORT}`);
});

process.on('SIGINT', () => {
    server.close(() => {
        console.log(' Shutting down server gracefully.');
        process.exit();
    });
});
