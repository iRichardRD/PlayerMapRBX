const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.static('public')); // Serve static files from public directory

// In-memory storage for player data (you might want to use a database for production)
let currentPlayerData = {
    gameId: null,
    placeId: null,
    timestamp: null,
    players: []
};

// API endpoint to receive player data from Roblox
app.post('/api/players', (req, res) => {
    try {
        console.log('Received player data from Roblox:', req.body);
        
        // Store the received data
        currentPlayerData = {
            gameId: req.body.gameId,
            placeId: req.body.placeId,
            timestamp: req.body.timestamp,
            players: req.body.players || []
        };
        
        res.json({ 
            success: true, 
            message: 'Player data received successfully',
            playerCount: currentPlayerData.players.length
        });
    } catch (error) {
        console.error('Error processing player data:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process player data' 
        });
    }
});

// API endpoint to serve player data to your website
app.get('/api/players', (req, res) => {
    try {
        // Check if data is recent (within last 10 seconds)
        const now = Math.floor(Date.now() / 1000);
        const dataAge = now - (currentPlayerData.timestamp || 0);
        
        if (dataAge > 10) {
            // Data is stale, return empty player list
            res.json({
                gameId: currentPlayerData.gameId,
                placeId: currentPlayerData.placeId,
                timestamp: currentPlayerData.timestamp,
                players: [],
                status: 'stale_data',
                dataAge: dataAge
            });
        } else {
            // Data is fresh
            res.json({
                ...currentPlayerData,
                status: 'active',
                dataAge: dataAge
            });
        }
    } catch (error) {
        console.error('Error serving player data:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve player data' 
        });
    }
});

// Serve your main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online',
        timestamp: new Date().toISOString(),
        playerCount: currentPlayerData.players.length,
        lastUpdate: currentPlayerData.timestamp
    });
});

// Debug endpoint to view current data
app.get('/api/debug', (req, res) => {
    res.json({
        currentData: currentPlayerData,
        serverTime: Math.floor(Date.now() / 1000),
        dataAge: Math.floor(Date.now() / 1000) - (currentPlayerData.timestamp || 0)
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Player tracker available at: http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  POST /api/players - Receive data from Roblox`);
    console.log(`  GET /api/players - Serve data to website`);
    console.log(`  GET /api/health - Server health check`);
    console.log(`  GET /api/debug - Debug current data`);
});