const http = require("http");
const express = require("express");
const app = express();
const WebSocket = require("ws");

// Constants
const ACTIVE_LIMIT = 20;

// Storage for clients and queue
let mainClients = [];
let queuedClients = [];
let touchDesignerClient = null;

// Server setup
const serverPort = process.env.PORT || 3000;
const server = http.createServer(app);

const wss =
  process.env.NODE_ENV === "production"
    ? new WebSocket.Server({ server })
    : new WebSocket.Server({ port: 5001 });

server.listen(serverPort);
console.log(`Server started on port ${serverPort} in stage ${process.env.NODE_ENV}`);

wss.on("connection", function (ws, req) {
  console.log("Connection Opened");

  ws.on("message", (data) => {
    let stringifiedData = data.toString();

    if (stringifiedData === 'pong') {
      console.log('keepAlive');
      return;
    }

    if (stringifiedData === 'TOUCHDESIGNER_ID') {
      touchDesignerClient = ws;
      console.log("TouchDesigner client connected!");
      return;
    }

    if (touchDesignerClient) {
      touchDesignerClient.send(stringifiedData);
    }
  });

  // Manage new connections
  if (mainClients.length < ACTIVE_LIMIT) {
    mainClients.push(ws);
    ws.send(JSON.stringify({ type: 'status', status: 'connected' }));
  } else {
    queuedClients.push(ws);
    ws.send(JSON.stringify({ type: 'status', status: 'queued' }));
  }

  ws.on("close", (data) => {
    console.log("closing connection");

    // Check if TouchDesigner client is disconnecting
    if (ws === touchDesignerClient) {
        console.log("TouchDesigner client disconnected!");
        touchDesignerClient = null;
        broadcast(null, JSON.stringify({ type: 'status', status: 'touchDesignerOffline' }), true);
    }

    // Handle other clients
    mainClients = mainClients.filter(client => client !== ws);
    queuedClients = queuedClients.filter(client => client !== ws);

    // Promote queued clients
    if (mainClients.length < ACTIVE_LIMIT && queuedClients.length > 0) {
      const promotedClient = queuedClients.shift();
      mainClients.push(promotedClient);
      promotedClient.send(JSON.stringify({ type: 'status', status: 'promoted' }));
    }
  });
});

// Implement broadcast function because of ws doesn't have it
const broadcast = (ws, message, includeSelf) => {
    if (includeSelf) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } else {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  };
  
  /**
   * Sends a ping message to all connected clients every 50 seconds
   */
   const keepServerAlive = () => {
    keepAliveId = setInterval(() => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send('ping');
        }
      });
    }, 50000);
  };
  
  
  app.get('/', (req, res) => {
      res.send('Hello World!');
  });