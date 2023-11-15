let ws = new WebSocket('wss://smart-perf-7d930c61dbd0.herokuapp.com:443');

//Slider 1, Ogni volta che cambio un valore allo slider, li reinvia entrambi

let controlTD = document.querySelector('.controlTD');

controlTD.addEventListener('input', (event) =>{
    console.log(controlTD.value);

    ws.send(JSON.stringify({'slider1': controlTD.value,'slider2': controlTD2.value}))

    // ws.send(JSON.stringify({'slider1': controlTD.value}))
});


 ws.addEventListener('message', function (event) {
    if (event.data) {
         console.log(event.data)
        let countContainer = document.getElementById ('controlTD')
           const widgetParent = document.getElementById('countContainer');
          widgetParent.innerHTML = event.data
    }


});

//Slider 2, Ogni volta che cambio un valore allo slider, li reinvia entrambi

let controlTD2 = document.querySelector('.controlTD2');

controlTD2.addEventListener('input', (event) =>{
    console.log(controlTD2.value);

    // ws.send(JSON.stringify({'slider2': controlTD2.value}))

    ws.send(JSON.stringify({'slider1': controlTD.value,'slider2': controlTD2.value}))
});


 ws.addEventListener('message2', function (event) {
    if (event.data) {
         console.log(event.data)
        let countContainer = document.getElementById ('controlTD2')
           const widgetParent = document.getElementById('countContainer');
          widgetParent.innerHTML = event.data
    }


});





  ws.addEventListener("message", (message) => {
    console.log(message);
  });

  ws.addEventListener("error", (error) => {
    console.log('websocket closed');
  });

  ws.addEventListener("close", (event) => {
    console.log('websocket closed');
  });




