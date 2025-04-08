const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('./middleware/auth');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const { standardLimiter } = require('./middleware/rateLimiter');
const helmet = require('helmet'); // Add this line
const csrf = require('csurf'); // Add after the existing requires
const mongoSanitize = require('express-mongo-sanitize');
const rateLimiter = require('./middleware/rateLimiter'); // Add this line near the top of the file with other imports

// Load env vars
dotenv.config();

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'https://10.12.47.226', 
    methods: ["GET", "POST"]
  }
});

// Apply Helmet (before other middleware)
app.use(helmet()); // Add this line

// Add CSP specifically configured for your app with Socket.IO support
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://code.jquery.com", "https://cdn.jsdelivr.net", "https://stackpath.bootstrapcdn.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
    styleSrc: ["'self'", "https://stackpath.bootstrapcdn.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'", "wss:"],
    fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
}));

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
    socket.emit('test-ping', { message: 'Server ping', timestamp: new Date() });
  }, 10000);
});

// Make io accessible to our routes
app.set('io', io);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/helpdesk', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
  autoIndex: process.env.NODE_ENV !== 'production', // Disable auto indexing in production
  ssl: process.env.NODE_ENV === 'production', // Enable SSL in production
  sslValidate: process.env.NODE_ENV === 'production'
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// EJS
app.set('view engine', 'ejs');

// Express body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Add after express json and urlencoded middleware
app.use(mongoSanitize());

// Cookie parser
app.use(cookieParser());

// Express session - needed for flash messages
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 60 * 60 * 1000, // 1 hour
    httpOnly: true,
    secure: true, // Always use secure cookies in production
    sameSite: 'strict'
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
app.use('/organizations', require('./routes/organizations'));

// CSRF Protection
const csrfProtection = csrf({ cookie: true }); // Add after cookie-parser middleware

// Add this to routes that use forms (after your routes are defined)
app.use('/auth', csrfProtection, require('./routes/auth'));
app.use('/tickets', csrfProtection, require('./routes/tickets'));
app.use('/admin', csrfProtection, require('./routes/admin'));

// Error handling middleware
app.use((req, res) => {
  res.status(404).render('error', {
    message: 'Page not found',
    error: { status: 404 }
  });
});

// Apply rate limiters only to specific routes that need protection:
// For example:
app.use('/login', rateLimiter.authLimiter);
app.use('/register', rateLimiter.authLimiter);
app.use('/password-reset', rateLimiter.authLimiter);

// For ticket-related routes
app.use('/tickets', rateLimiter.ticketLimiter);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));