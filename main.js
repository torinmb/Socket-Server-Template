const http = require("http");
const express = require("express");
const app = express();
const { v4: uuidv4 } = require('uuid');

app.use(express.static("public"));

const ACTIVE_LIMIT = 5;

const serverPort = process.env.PORT || 3000;
const server = http.createServer(app);
const WebSocket = require("ws");

let keepAliveId;
let touchDesignerClient = null;

const wss =
  process.env.NODE_ENV === "production"
    ? new WebSocket.Server({ server })
    : new WebSocket.Server({ port: 5001 });

server.listen(serverPort);
console.log(`Server started on port ${serverPort} in stage ${process.env.NODE_ENV}`);

wss.on("connection", function (ws, req) {
  console.log("Connection Opened");
  console.log("Client size: ", wss.clients.size);

  if (wss.clients.size === 1) {
    console.log("first connection. starting keepalive");
    keepServerAlive();
  }

  ws.once('message', (initialData) => {
    let stringifiedData = initialData.toString();

    // If the connecting client is the TouchDesigner client
    if (stringifiedData === "TOUCHDESIGNER_ID") {
      if (touchDesignerClient) {  // If another TD client is already connected, close the previous one
        touchDesignerClient.close();
      }
      touchDesignerClient = ws;
      ws.key = uuidv4();
      console.log("TouchDesigner client connected!");
      ws.send(JSON.stringify({ type: "status", status: "connected", key: ws.key }));
      return;
    }

    // For regular clients, if they're within the ACTIVE_LIMIT, allow them to connect
    if ((wss.clients.size - (touchDesignerClient ? 1 : 0)) > ACTIVE_LIMIT) {
      if (!ws.key) {  // If this client doesn't have a key yet, they're a new connection
        ws.send(JSON.stringify({ type: "status", status: "queued", count: wss.clients.size }));
        ws.close(); // Close the connection if over limit
        return;
      }
    } else {
      ws.key = ws.key || uuidv4();  // Assign a key if it doesn't have one yet
      ws.send(JSON.stringify({ type: "status", status: "connected", key: ws.key }));
    }
  });

  ws.on("message", (data) => {
    let stringifiedData = data.toString();
    if (stringifiedData === 'pong') {
      console.log('keepAlive');
      return;
    }

    if (stringifiedData === "TOUCHDESIGNER_ID" || stringifiedData === "clientConnection") {
        console.log("start message", stringifiedData);
        return;
    }

    if (touchDesignerClient && touchDesignerClient.readyState === WebSocket.OPEN) {
        if (ws.key !== undefined) {
            const modifiedMessage = {
                id: ws.key,
                data: JSON.parse(data),
            };
            touchDesignerClient.send(JSON.stringify(modifiedMessage));
        }
    }
    // broadcast(ws, stringifiedData, false);
  });

  ws.on("close", (data) => {
    console.log("closing connection");
    if (touchDesignerClient && touchDesignerClient.readyState === WebSocket.OPEN) {
        if (ws.key !== undefined) {
            const message = {
                id: ws.key,
                disconnect: true,
            };
            touchDesignerClient.send(JSON.stringify(message));
        }
    }

    if (ws === touchDesignerClient) {
        console.log("TouchDesigner client disconnected!");
        touchDesignerClient = null;
        return;
    }

    if (wss.clients.size === 0) {
      console.log("last client disconnected, stopping keepAlive interval");
      clearInterval(keepAliveId);
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
