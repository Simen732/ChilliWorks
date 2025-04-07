const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken'); // Add this line
const { verifyToken } = require('./middleware/auth');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load env vars
dotenv.config();

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Socket.IO middleware to handle authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  if (!token) {
    console.log('Socket authentication failed: No token provided');
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET);
    socket.user = decoded;
    console.log(`Socket authenticated for user: ${decoded.name}`);
    next();
  } catch (err) {
    console.error('Socket authentication error:', err.message);
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  
  // Join room for each ticket the user is viewing
  socket.on('join-ticket', (ticketId) => {
    socket.join(`ticket-${ticketId}`);
    console.log(`Socket ${socket.id} joined room: ticket-${ticketId}`);
  });
  
  // Leave room when user leaves ticket page
  socket.on('leave-ticket', (ticketId) => {
    socket.leave(`ticket-${ticketId}`);
    console.log(`Socket ${socket.id} left room: ticket-${ticketId}`);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });

  // Send a test message every 10 seconds
  setInterval(() => {
    console.log('Sending test ping to connected clients');
    socket.emit('test-ping', { message: 'Server ping', timestamp: new Date() });
  }, 10000);
});

// Make io accessible to our routes
app.set('io', io);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/helpdesk', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// EJS
app.set('view engine', 'ejs');

// Express body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Express session - needed for flash messages
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 60 * 60 * 1000 // 1 hour - only used for flash messages, not authentication
  }
}));

// Connect flash - requires session
app.use(flash());

// Method override
app.use(methodOverride('_method'));

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// JWT Verification Middleware (sets req.user)
app.use(verifyToken);

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/tickets', require('./routes/tickets'));
app.use('/admin', require('./routes/admin'));

// Error handling middleware
app.use((req, res) => {
  res.status(404).render('error', {
    message: 'Page not found',
    error: { status: 404 }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));