// Global Socket.IO connection for all pages
document.addEventListener('DOMContentLoaded', function() {
  // Only attempt to connect if user is logged in
  const userDataElem = document.getElementById('user-data');
  if (!userDataElem) return;

  try {
    const user = JSON.parse(userDataElem.dataset.user);
    
    // Get token for authentication
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    const token = getCookie('socket_token');
    console.log('Socket token found:', token ? 'Yes' : 'No');

    if (!token) return;

    // Connect to Socket.IO server with authentication
    const socket = io({
      auth: {
        token
      }
    });

    // Make socket globally available
    window.appSocket = socket;

    // Connection established
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      
      // Receive test pings from server
      socket.on('test-ping', (data) => {
        console.log('Received test ping from server:', data);
      });
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error.message);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
    });

  } catch (error) {
    console.error('Error initializing socket connection:', error);
  }
});

// Function to show notifications (can be used globally)
function showNotification(message, type = 'info') {
  const notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '1000';
    document.body.appendChild(container);
  }
  
  const alertClass = type === 'error' ? 'alert-danger' : 
                    type === 'success' ? 'alert-success' : 'alert-info';
  
  const notification = document.createElement('div');
  notification.className = `alert ${alertClass} alert-dismissible fade show`;
  notification.innerHTML = `
    ${message}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  `;
  
  document.getElementById('notification-container').appendChild(notification);
  
  // Remove notification after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}