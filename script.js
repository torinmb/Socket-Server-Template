let ws = new WebSocket('wss://our-socket-server.herokuapp.com/:443');
  

ws.addEventListener('open', (event) => {
  console.log('websocket opened')
});

ws.addEventListener('message', (message) => {
  console.log(message);
});

ws.addEventListener('error', (error) => {
  console.error('websocket closed')
});

ws.addEventListener('close', (event) => {
  console.log('websocket closed')
});
