# ChilliWorks - Help Desk Ticketing System

![ChilliWorks](https://via.placeholder.com/800x400?text=ChilliWorks+Ticketing+System)

ChilliWorks is a modern, responsive help desk ticketing system built with Node.js. It provides organizations with a robust platform to handle support tickets, manage users, and streamline communication between support teams and customers.

## 🚀 Features

- **Role-Based Access Control**: Different permission levels for users, support staff, and administrators
- **Ticket Management**: Create, view, edit, and track support tickets
- **Real-Time Updates**: Socket.IO integration for live notifications and updates
- **Multi-Tier Support**: Assign tickets to different support tiers (linje 1, linje 2)
- **Organization Management**: Group users by organizations
- **Responsive Design**: Mobile-friendly dark-themed UI with modern aesthetics
- **Comprehensive Dashboard**: Statistics and overview for administrators
- **Activity Logging**: Track all system activities for accountability
- **Comment System**: Communicate with users on tickets
- **User Management**: Admin tools for managing user accounts and permissions

## 📋 Prerequisites

- Node.js (v12.x or higher)
- MongoDB (v4.x or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ChilliWorks.git
cd ChilliWorks
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory with the following variables:

```
MONGO_URI=mongodb://localhost:27017/helpdesk
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret
PORT=3000
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
APP_URL=http://localhost:3000
APP_NAME=ChilliWorks
```

4. **Start the application**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🏗️ Project Structure

```
ChilliWorks/
├── controllers/       # Route controllers
├── middleware/        # Express middleware
├── models/            # Mongoose models
├── public/            # Static assets (CSS, JS)
├── routes/            # Express routes
├── services/          # Business logic services
├── views/             # EJS templates
├── utils/             # Utility functions
├── app.js             # Application entry point
└── package.json       # Project dependencies
```

## 👥 User Roles

- **Regular User**: Can create and view their own tickets
- **Linje 1 Support**: First-tier support staff who handle initial ticket reviews
- **Linje 2 Support**: Advanced support staff who handle more complex issues
- **Admin**: Full system access, user management, and analytical capabilities
- **Manager**: Organization-level oversight of tickets and staff

## 🔒 Security Features

- JWT-based authentication
- CSRF protection
- Input validation and sanitization
- Rate limiting to prevent abuse
- Argon2 password hashing
- Secure HTTP-only cookies
- Configurable session management

## 💻 Key Technologies

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: EJS, Bootstrap 4, Custom CSS
- **Real-time Communication**: Socket.IO
- **Authentication**: JWT, Argon2
- **Security**: Helmet, CSRF, express-mongo-sanitize
- **Logging**: Winston

## 📱 Screenshots

![Dashboard](https://via.placeholder.com/400x200?text=Dashboard)
![Ticket Management](https://via.placeholder.com/400x200?text=Ticket+Management)
![Admin Panel](https://via.placeholder.com/400x200?text=Admin+Panel)

## 🛣️ API Routes

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - New user registration
- `GET /auth/logout` - User logout
- `POST /auth/forgot-password` - Password reset request

### Tickets
- `GET /tickets` - List tickets
- `POST /tickets` - Create new ticket
- `GET /tickets/:id` - View single ticket
- `PUT /tickets/:id` - Update ticket
- `DELETE /tickets/:id` - Delete ticket
- `POST /tickets/:id/comments` - Add comment to ticket

### Admin
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/users` - User management
- `PUT /admin/users/:id/role` - Update user role
- `DELETE /admin/users/:id` - Delete user
- `PUT /admin/tickets/:id/status` - Update ticket status
- `PUT /admin/tickets/:id/assign-role` - Assign ticket to support tier

### Organizations
- `GET /organizations` - List organizations
- `POST /organizations` - Create organization
- `GET /organizations/:id` - View organization
- `PUT /organizations/:id` - Update organization
- `POST /organizations/:id/users` - Add user to organization
- `POST /organizations/:id/regenerate-code` - Generate new registration code

## 📊 Database Schema

### User
- name (String)
- email (String, unique)
- password (String, hashed)
- role (Enum: 'user', 'employee', 'manager', 'linje 1', 'linje 2', 'admin')
- organization (ObjectId ref: 'Organization')
- resetPasswordToken (String)
- resetPasswordExpires (Date)
- createdAt (Date)

### Ticket
- title (String)
- description (String)
- category (Enum: 'Hardware', 'Software', 'Network', 'Other')
- priority (Enum: 'Low', 'Medium', 'High', 'Urgent')
- status (Enum: 'Open', 'In Progress', 'Resolved', 'Closed')
- user (ObjectId ref: 'User')
- assignedTo (ObjectId ref: 'User')
- assignedRole (Enum: 'linje 1', 'linje 2', null)
- organization (ObjectId ref: 'Organization')
- createdAt (Date)
- updatedAt (Date)

### Organization
- name (String, unique)
- description (String)
- createdBy (ObjectId ref: 'User')
- admins (Array of ObjectId ref: 'User')
- settings (Object)
- createdAt (Date)
- updatedAt (Date)

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📬 Contact

Project Link: [https://github.com/yourusername/ChilliWorks](https://github.com/yourusername/ChilliWorks)

## 🙏 Acknowledgements

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Bootstrap](https://getbootstrap.com/)
- [Socket.IO](https://socket.io/)
- [Font Awesome](https://fontawesome.com/)