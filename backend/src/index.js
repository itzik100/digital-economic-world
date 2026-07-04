require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/player');
const inventoryRoutes = require('./routes/inventory');
const marketRoutes = require('./routes/market');
const robotRoutes = require('./routes/robots');
const farmRoutes = require('./routes/farm');
const questRoutes = require('./routes/quests');
const adminRoutes = require('./routes/admin');

const { authenticateToken } = require('./middleware/auth');
const { setupRealtimeHandlers } = require('./services/realtime');
const { startRobotJobs } = require('./services/robotJobs');

const app = express();
const httpServer = http.createServer(app);
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.warn(`Missing ${key}. Set it in backend/.env before using database-backed routes.`);
  }
}

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

app.use('/api/auth', authRoutes);
app.use('/api/player', authenticateToken, playerRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/market', authenticateToken, marketRoutes);
app.use('/api/robots', authenticateToken, robotRoutes);
app.use('/api/farm', authenticateToken, farmRoutes);
app.use('/api/quests', authenticateToken, questRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

setupRealtimeHandlers(io);
startRobotJobs(io);

// Expose io so routes can emit events
app.set('io', io);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🌍 Digital World Backend running on port ${PORT}`);
});

process.on('SIGINT', () => httpServer.close(() => process.exit(0)));
process.on('SIGTERM', () => httpServer.close(() => process.exit(0)));
