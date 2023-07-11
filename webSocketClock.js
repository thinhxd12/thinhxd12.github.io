const server_url = 'uhr.ptb.de/time';
var time_ws;
var start_connectionTimeout;

let START_MINUTES = "06";
let START_SECOND = "00";
let duration = parseInt(START_SECOND, 10) + 60 * parseInt(START_MINUTES, 10);
let notifyMessageFlag = false;


function webSocketClock(server_url, config_dict) {
  var results_array = Array();
  // global settings
  let ptb_interval = 60000; // ms 
  let avg_length = 5; // amount of packets to calculate the delay
  let time_delta;     // difference between local clock and PTB clock

  // web socket
  let ws_connected = false;
  let ws_active = false;
  let ws_lastcheck = 0;
  var ws_timeout;

  // send rquest to the server
  // Note: The request includes the actual local time of the client's
  //       clock to measure the roundtrip time
  function sendPTB(text, reset_array) {
    if (reset_array) results_array = Array();
    if (text != "") console.log("websocket clock " + text);
    ws_active = true;
    time_ws.send(JSON.stringify({ c: performance.now() }));
  }

  function connect_server() {
    time_ws = new WebSocket('wss://' + server_url, 'time');

    // callback if socket is open
    time_ws.onopen = function (event) {
      ws_connected = true;
      console.log('connected');
      if (!ws_active) {
        sendPTB("opened", true);
      }
    }

    // callback if socket is closed
    time_ws.onclose = function (event) {
      ws_connected = false;
      ws_active = false;
      console.log('disconnected');
      console.log("websocket clock closed");
    }

    // callback in case of errors
    time_ws.onerror = function (event) {
      ws_connected = false;
      ws_active = false;
      console.log('disconnected');
      console.log("websocket clock error ", event);
    }

    // callback when receiving messages from the server
    time_ws.onmessage = function (event) {
      // console.log("onmessage",results_array.length,event);

      // convert received message to JSON object
      let data = JSON.parse(event.data);

      // console.log(data);

      // roundtrip time from client to server and back
      let roundtrip_time = performance.now() - data.c;

      // calculate time difference between local and server clock
      // (assuming that both directions are similar fast)
      let delta = performance.now() - data.s - roundtrip_time / 2.0;

      // leap second announced?
      let leap = data.l || 0;

      // if leep===3 server clock not synchronized --> data not valid
      if (leap === 3) {
        console.log('server sync error');
        ws_active = false;
        ws_timeout = setTimeout(function () {
          sendPTB("trying resync", true);
        },
          ptb_interval);
        return;
      }

      // save results for better accuracy
      // source: PTB
      results_array.push([delta, roundtrip_time, data.e])
      if (results_array.length > avg_length) {
        results_array.shift();
      }
      results_array.sort(function (a, b) { return a[1] - b[1] });

      // use the value with the lowest roundtrip
      time_delta = results_array[0][0];
      leap_delta = 0;
      accuracy = Math.round(results_array[0][1] / 2 + results_array[0][2])

      if (results_array.length < avg_length) {
        // array is not filled, next request immediately
        sendPTB("", false);
      }
      else {
        // get PTB UTC time
        let ts = performance.now() - time_delta;
        ts = Math.round(ts / 1000.0) % 86400;

        console.log('UTC time', ts);
        checkTimeup(ts);

        ws_active = false;
        ws_timeout = setTimeout(function () {
          if (time_ws.readyState === time_ws.OPEN) {
            sendPTB("", true);
          }
        }, ptb_interval);
      }

    } // onmessage
  }

  // start and monitor connection
  function start_connection() {
    // check again in 1s
    start_connectionTimeout = setTimeout(start_connection, 1000);
    // check connection
    if (ws_connected) {
      // connected --> check whether the window was sleeping
      if (performance.now() - ws_lastcheck > 3200) {
        // slept --> wake up
        clearTimeout(ws_timeout);
        sendPTB("restart after sleep", true);
      }
    }
    else {
      // not connected --> connect
      connect_server();
    }
    // remember last check
    ws_lastcheck = performance.now();
  }
  start_connection();
}


let firstTimestamp = 0;

const startHandler = () => {
  let ts = new Date();
  firstTimestamp = Math.round(ts / 1000.0) % 86400;
  console.log('start', firstTimestamp);
  webSocketClock(server_url);
  let audioEl = document.getElementById("tts-audio");
  audioEl.pause();
};

const resetHandler = () => {
  time_ws.close();
  clearTimeout(start_connectionTimeout);
  $('#tomatoText').hide();
  let audioEl = document.getElementById("tts-audio");
  audioEl.pause();
};

function checkTimeup(time) {
  let res = time - firstTimestamp;
  if (firstTimestamp > 0) {
    //play sound prevent Chrome throttle
    let audioEl = document.getElementById("tts-audio");
    audioEl.src = 'https://mobcup.net/va/Eebd354329c9608a5b5544cb04c7996b9';
    audioEl.volume = 0.01;
    audioEl.play();
    // render Tomato timer
    let minutes = parseInt((duration - res) / 60, 10);
    // let seconds = parseInt((duration - res) % 60, 10);
    $('#tomatoText').show();
    // $('#tomatoText').text(seconds + 's');
    $('#tomatoText').text((minutes + 1) * 1 + 'm');

    if (res > duration) {
      firstTimestamp = 0;
      $('#tomatoText').hide();
      audioEl.src = 'https://mobcup.net/va/66kjwO3ODzg';
      audioEl.volume = 1;
      audioEl.play();
      $('#tomatoText').toggleClass('tomatoFocus');
      notifyMessageFlag = !notifyMessageFlag;
      showDesktopNotification();
      time_ws.close();
      clearTimeout(start_connectionTimeout);
    }
  }
}


$('#wordNum').click(function (e) {
  resetHandler();
});

$('#tomatoButton').click(function (e) {
  startHandler();
});


const showDesktopNotification = () => {
  let bodyText = notifyMessageFlag ? "Start Focusing" : "Take a Short Break";
  const img = 'https://cdn-icons-png.flaticon.com/512/1790/1790418.png';
  const notification = new Notification(bodyText, {
    icon: img,
    requireInteraction: true  //requireInteraction In macos set notification Chrome to Alert not Banner
  })
  notification.onclick = (e) => {
    startHandler();
    // notification.close();
  }
  notification.onclose = (e) => {
    resetHandler();
    // notification.close();
  }
}

if (Notification.permission !== "granted") {
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      showDesktopNotification();
    }
  })
}
