const http = require("http");
const express = require("express");
const app = express();

app.use(express.static("public"));
// require("dotenv").config();

const port = process.env.PORT || 3000;
const server = http.createServer(app);
const WebSocket = require("ws");

let keepAliveId;

const PING_SAFEWORD = "bananaStand";

const wss =
  process.env.NODE_ENV === "production"
    ? new WebSocket.Server({ server })
    : new WebSocket.Server({ port: 5001 });

server.listen(port);
console.log('test', wss);
console.log(`Server started on port ${process.env.PORT} in stage ${process.env.NODE_ENV}`);

wss.on("connection", function (ws, req) {
  console.log("Connection Opened");

  console.log("Client size: ", wss.clients.size);

  if (wss.clients.size === 1) {
    console.log("first connection. starting keepalive");
    // keepServerAlive();
  }

  ws.on("message", (data) => {
    // console.log('got message', data)
    if(data === "keepAlive") {
      console.log('keepAlive');
      return; 
    }
    broadcast(ws, data, false);
    // if (isJSON(data)) {
    //   // Message is a valid JSON string, non-encrypted
    //   const result = JSON.parse(data);
    //   if (result !== "") {
    //     // console.log(result);
    //     if (result === PING_SAFEWORD) return;
    //     broadcast(ws, result, false);
    //   } else {
    //     console.log("empty json");
    //   }
    // }
  });

  ws.on("close", (data) => {
    console.log("closing connection");

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
        client.send(JSON.stringify(message));
      }
    });
  }
};

const isJSON = (message) => {
  try {
    const obj = JSON.parse(message);
    return obj && typeof obj === "object";
  } catch (err) {
    return false;
  }
};


/**
 * Sends a ping message to all connected clients every 50 seconds
 */
const keepServerAlive = () => {
  keepAliveId = setInterval(() => {
    const keepAliveMessage = PING_SAFEWORD;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(keepAliveMessage);
      }
    });
  }, 50000);
};

app.get('/', (req, res) => {
    res.send('Hello World!');
});