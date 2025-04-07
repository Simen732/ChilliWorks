// Socket.IO client-side functionality
document.addEventListener('DOMContentLoaded', function() {
  // Get the current user from the data attribute
  const userDataElem = document.getElementById('user-data');
  if (!userDataElem) return;

  const user = JSON.parse(userDataElem.dataset.user);
  
  // Update token extraction:
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const token = getCookie('socket_token');
  console.log('Token found:', token ? 'Yes' : 'No');

  if (!token) return;

  // Connect to Socket.IO server with authentication
  const socket = io({
    auth: {
      token
    }
  });

  // Connection established
  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    
    // Check if we are on a ticket view page
    const ticketContainer = document.getElementById('ticket-container');
    if (ticketContainer) {
      const ticketId = ticketContainer.dataset.ticketId;
      
      // Join the ticket room
      socket.emit('join-ticket', ticketId);
      
      // Listen for status updates
      socket.on('status-update', data => {
        if (data.ticketId === ticketId) {
          updateTicketStatus(data);
        }
      });
      
      // Listen for new comments
      socket.on('new-comment', data => {
        if (data.ticketId === ticketId) {
          addNewComment(data.comment);
        }
      });
      
      // Listen for ticket updates
      socket.on('ticket-update', data => {
        if (data.ticketId === ticketId) {
          updateTicketDetails(data);
        }
      });
      
      // When leaving the page, leave the ticket room
      window.addEventListener('beforeunload', () => {
        socket.emit('leave-ticket', ticketId);
      });
    }
  });

  // Handle comment submission via AJAX
  const commentForm = document.getElementById('comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const ticketContainer = document.getElementById('ticket-container');
      if (!ticketContainer) return;
      
      const ticketId = ticketContainer.dataset.ticketId;
      const commentText = document.getElementById('comment-text').value;
      
      if (!commentText.trim()) return;
      
      try {
        const response = await fetch(`/tickets/${ticketId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: commentText })
        });
        
        if (response.ok) {
          // Clear the form - the socket will handle UI update
          document.getElementById('comment-text').value = '';
        } else {
          const data = await response.json();
          showNotification(data.error || 'Error adding comment', 'error');
        }
      } catch (err) {
        console.error('Error posting comment:', err);
        showNotification('Network error while posting comment', 'error');
      }
    });
  }

  // Handle connection error
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
  });

  // Function to update ticket status in the UI
  function updateTicketStatus(data) {
    const statusElement = document.querySelector('.status');
    if (statusElement) {
      // Remove old status classes
      statusElement.classList.forEach(className => {
        if (className.startsWith('status-')) {
          statusElement.classList.remove(className);
        }
      });
      
      // Add new status class
      const newStatusClass = `status-${data.status.toLowerCase().replace(/\s+/g, '-')}`;
      statusElement.classList.add(newStatusClass);
      
      // Update text
      statusElement.textContent = data.status;
      
      // Show notification
      showNotification(`Status updated to ${data.status} by ${data.updatedBy}`);
    }
  }

  // Function to add a new comment to the UI
  function addNewComment(comment) {
    let commentsList = document.querySelector('.comments-list');
    const noCommentsMessage = document.querySelector('.comments-section p.text-muted');
    
    if (noCommentsMessage) {
      noCommentsMessage.remove();
      
      // Create comments list if it doesn't exist
      if (!commentsList) {
        const commentsSection = document.querySelector('.comments-section');
        const newCommentsList = document.createElement('div');
        newCommentsList.className = 'comments-list';
        commentsSection.insertBefore(newCommentsList, document.querySelector('.add-comment'));
        commentsList = newCommentsList; // Use the new element
      }
    }
    
    // Create new comment element
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.innerHTML = `
      <div class="meta">
        <div>
          <strong>${comment.user.name}</strong>
          ${comment.user.role === 'admin' ? '<span class="badge badge-primary">Admin</span>' : ''}
        </div>
        <small>${new Date(comment.createdAt).toLocaleString()}</small>
      </div>
      <p class="text">${comment.text}</p>
    `;
    
    commentsList.appendChild(commentElement);
    
    // Update comment count
    const commentsHeading = document.querySelector('.comments-section h4');
    if (commentsHeading) {
      const currentCount = parseInt(commentsHeading.textContent.match(/\d+/)[0]);
      commentsHeading.textContent = `Comments (${currentCount + 1})`;
    }
    
    // Show notification
    showNotification('New comment added');
  }

  // Function to update ticket details in the UI
  function updateTicketDetails(data) {
    const titleElement = document.querySelector('.card-header h3');
    if (titleElement) {
      titleElement.textContent = data.title;
    }
    
    const categoryElement = document.querySelector('.ticket-meta .row .col-md-3:first-child strong + span');
    if (categoryElement) {
      categoryElement.textContent = data.category;
    }
    
    const priorityElement = document.querySelector('.ticket-meta .row .col-md-3:nth-child(2) strong + span');
    if (priorityElement) {
      priorityElement.textContent = data.priority;
    }
    
    const descriptionElement = document.querySelector('.ticket-description p');
    if (descriptionElement) {
      descriptionElement.textContent = data.description;
    }
    
    // Show notification
    showNotification(`Ticket details updated by ${data.updatedBy}`);
  }

  // Function to show a notification
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
    
    const alertClass = type === 'error' ? 'alert-danger' : 'alert-info';
    
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
});