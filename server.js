const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = 3000;
const ISSUES_FILE = 'issues.json';

// Serve static files from 'public' folder
app.use(express.static('public'));
app.use(express.json());

// Load issues from file or create empty list
function loadIssues() {
  if (!fs.existsSync(ISSUES_FILE)) {
    const emptyData = { issues: [] };
    fs.writeFileSync(ISSUES_FILE, JSON.stringify(emptyData, null, 2));
    return emptyData;
  }
  const fileContent = fs.readFileSync(ISSUES_FILE, 'utf8');
  return JSON.parse(fileContent);
}

// Save issues to file
function saveIssues(data) {
  fs.writeFileSync(ISSUES_FILE, JSON.stringify(data, null, 2));
  console.log('Issues saved to file');
}

// API to get all issues
app.get('/api/issues', (req, res) => {
  const data = loadIssues();
  res.json(data);
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Open the URL in your browser to use the issue tracker');
});

// Create WebSocket server
const websocketServer = new WebSocket.Server({ server });

// Send message to all connected clients
function sendToAllClients(data) {
  const message = JSON.stringify(data);
  websocketServer.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Handle WebSocket connections
websocketServer.on('connection', clientSocket => {
  console.log('New client connected');
  
  // Send current issues to new client
  const currentIssues = loadIssues();
  clientSocket.send(JSON.stringify({ type: 'init', payload: currentIssues }));

  // Handle messages from client
  clientSocket.on('message', message => {
    try {
      const clientMessage = JSON.parse(message);
      handleClientMessage(clientMessage);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  clientSocket.on('close', () => {
    console.log('Client disconnected');
  });
});

// Handle different types of messages from clients
function handleClientMessage(message) {
  const data = loadIssues();
  
  if (message.type === 'create') {
    // Create new issue
    const issues = data.issues;
    const newId = getNextId(issues);
    
    const newIssue = {
      id: newId,
      title: message.payload.title || 'Untitled',
      description: message.payload.description || '',
      status: 'Open',
      createdBy: message.payload.createdBy || 'Anonymous',
      comments: [],
      createdAt: new Date().toISOString()
    };
    
    issues.push(newIssue);
    saveIssues(data);
    sendToAllClients({ type: 'created', payload: newIssue });
    
  } else if (message.type === 'update') {
    // Update existing issue
    const issue = findIssueById(data.issues, message.payload.id);
    if (issue) {
      if (message.payload.title) issue.title = message.payload.title;
      if (message.payload.description) issue.description = message.payload.description;
      if (message.payload.status) issue.status = message.payload.status;
      
      saveIssues(data);
      sendToAllClients({ type: 'updated', payload: issue });
    }
    
  } else if (message.type === 'comment') {
    // Add comment to issue
    const issue = findIssueById(data.issues, message.payload.id);
    if (issue) {
      const newComment = {
        text: message.payload.text || '',
        by: message.payload.by || 'Anonymous',
        at: new Date().toISOString()
      };
      
      issue.comments.push(newComment);
      saveIssues(data);
      sendToAllClients({ 
        type: 'commented', 
        payload: { issueId: issue.id, comment: newComment } 
      });
    }
  }
}

// Helper function to get next available ID
function getNextId(issues) {
  let maxId = 0;
  for (let issue of issues) {
    if (issue.id > maxId) {
      maxId = issue.id;
    }
  }
  return maxId + 1;
}

// Helper function to find issue by ID
function findIssueById(issues, id) {
  for (let issue of issues) {
    if (issue.id === id) {
      return issue;
    }
  }
  return null;
}