const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const logger = require('./config/logger');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store io in app for access in controllers
app.set('io', io);

// Routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const doctorRoutes = require('./routes/doctors');
const aiRoutes = require('./routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/ai', aiRoutes);

// Socket Events
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  // Clients can join a room specific to a doctor to listen for queue updates
  socket.on('join_doctor_room', (doctorId) => {
    socket.join(`doctor_${doctorId}`);
    logger.info(`Socket ${socket.id} joined room doctor_${doctorId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Hospital API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
