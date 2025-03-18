import { app } from './app.js';

const PORT = process.env.PORT || 3000;  // Ensure Railway assigns this dynamically

// Don't specify HOST (let Railway handle it)
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

process.on('SIGINT', () => {
    server.close(() => {
        console.log('Shutting down server gracefully.');
        process.exit();
    });
});
