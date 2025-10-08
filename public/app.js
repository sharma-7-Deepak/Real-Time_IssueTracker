// Connect to WebSocket server
const socket = new WebSocket('ws://localhost:3000');

// Get HTML elements
const tableBody = document.querySelector('#table tbody');
const createButton = document.getElementById('btnCreate');

// Store all issues
let allIssues = [];

// When connected to server
socket.addEventListener('open', () => {
  console.log('Connected to server');
});

// When receiving message from server
socket.addEventListener('message', (event) => {
  try {
    const message = JSON.parse(event.data);
    handleServerMessage(message);
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

// Handle different types of messages from server
function handleServerMessage(message) {
  if (message.type === 'init') {
    // Initial load of all issues
    allIssues = message.payload.issues || [];
    displayAllIssues();
    
  } else if (message.type === 'created') {
    // New issue was created
    allIssues.push(message.payload);
    displayAllIssues();
    
  } else if (message.type === 'updated') {
    // Issue was updated
    const issue = findIssueById(message.payload.id);
    if (issue) {
      issue.title = message.payload.title;
      issue.description = message.payload.description;
      issue.status = message.payload.status;
    }
    displayAllIssues();
    
  } else if (message.type === 'commented') {
    // Comment was added to issue
    const issue = findIssueById(message.payload.issueId);
    if (issue) {
      issue.comments.push(message.payload.comment);
    }
    displayAllIssues();
  }
}

// Display all issues in the table
function displayAllIssues() {
  // Clear the table
  tableBody.innerHTML = '';
  
  // Add each issue to the table
  for (let issue of allIssues) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${issue.id}</td>
      <td>
        <strong>${makeSafe(issue.title)}</strong><br/>
        <small>${makeSafe(issue.description || '')}</small>
      </td>
      <td>${issue.status}</td>
      <td>${makeSafe(issue.createdBy || '')}</td>
      <td>
        ${showComments(issue.comments || [])}
        <div style="margin-top:6px;">
          <input placeholder="Your name" data-issue="${issue.id}" class="name-input" style="width:90px"/>
          <input placeholder="Add comment" data-issue="${issue.id}" class="comment-input" />
          <button data-issue="${issue.id}" class="comment-button">Post</button>
        </div>
      </td>
      <td>
        <select data-id="${issue.id}" class="status-dropdown">
          <option ${issue.status==='Open'?'selected':''}>Open</option>
          <option ${issue.status==='In Progress'?'selected':''}>In Progress</option>
          <option ${issue.status==='Closed'?'selected':''}>Closed</option>
        </select>
      </td>
    `;
    tableBody.appendChild(row);
  }

  // Set up comment buttons
  const commentButtons = document.querySelectorAll('.comment-button');
  for (let button of commentButtons) {
    button.onclick = function() {
      const issueId = Number(button.getAttribute('data-issue'));
      const commentInput = document.querySelector('.comment-input[data-issue="'+issueId+'"]');
      const nameInput = document.querySelector('.name-input[data-issue="'+issueId+'"]');
      
      const commentText = commentInput.value.trim();
      const userName = nameInput.value.trim() || 'Anonymous';
      
      if (!commentText) {
        alert('Please enter a comment');
        return;
      }
      
      sendCommentToServer(issueId, commentText, userName);
      commentInput.value = '';
    };
  }

  // Set up status dropdowns
  const statusDropdowns = document.querySelectorAll('.status-dropdown');
  for (let dropdown of statusDropdowns) {
    dropdown.onchange = function() {
      const issueId = Number(dropdown.getAttribute('data-id'));
      const newStatus = dropdown.value;
      sendStatusUpdateToServer(issueId, newStatus);
    };
  }
}

// Show all comments for an issue
function showComments(comments) {
  if (!comments || comments.length === 0) {
    return '<div class="small">No comments yet</div>';
  }
  
  let html = '';
  for (let comment of comments) {
    html += `<div class="comment">
      <strong>${makeSafe(comment.by)}</strong> - ${makeSafe(comment.text)}<br/>
      <small class="small">${comment.at || ''}</small>
    </div>`;
  }
  return html;
}

// Make text safe for HTML display
function makeSafe(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Helper functions to find issues and send messages
function findIssueById(id) {
  for (let issue of allIssues) {
    if (issue.id === id) {
      return issue;
    }
  }
  return null;
}

function sendCommentToServer(issueId, text, userName) {
  const message = {
    type: 'comment',
    payload: { id: issueId, text: text, by: userName }
  };
  socket.send(JSON.stringify(message));
}

function sendStatusUpdateToServer(issueId, status) {
  const message = {
    type: 'update',
    payload: { id: issueId, status: status }
  };
  socket.send(JSON.stringify(message));
}

function sendNewIssueToServer(title, description, createdBy) {
  const message = {
    type: 'create',
    payload: { title: title, description: description, createdBy: createdBy }
  };
  socket.send(JSON.stringify(message));
}

// Handle create new issue button
createButton.onclick = function() {
  const titleInput = document.getElementById('title');
  const descriptionInput = document.getElementById('description');
  const createdByInput = document.getElementById('createdBy');
  
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const createdBy = createdByInput.value.trim() || 'Anonymous';
  
  if (!title) {
    alert('Please enter a title for the issue');
    return;
  }
  
  sendNewIssueToServer(title, description, createdBy);
  
  // Clear the form
  titleInput.value = '';
  descriptionInput.value = '';
};