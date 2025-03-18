import { app } from './app.js';

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';  // Ensure app listens on all interfaces

const server = app.listen(PORT, HOST, () => {
    console.log(` Server is running on http://${HOST}:${PORT}`);
});

process.on('SIGINT', () => {
    server.close(() => {
        console.log(' Shutting down server gracefully.');
        process.exit();
    });
});
