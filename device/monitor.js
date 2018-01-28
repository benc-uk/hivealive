//
// HiveAlive RaspberryPi IOT monitoring
// Ben Coleman, 2018
//

// Load config
var config = JSON.parse(require('fs').readFileSync("config.json"));

console.log(`### Initialized with IOT endpoint: '${config.iotEndpoint}', as device '${config.iotDeviceId}', at interval ${config.pollInterval} secs`);

// IoT connection stuff
var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
var Message = require('azure-iot-device').Message;
var connectionString = `HostName=${config.iotEndpoint};DeviceId=${config.iotDeviceId};SharedAccessKey=${config.iotDeviceKey}`;
var client = clientFromConnectionString(connectionString);

// OS and general Node things
const exec = require('child_process').exec;
var uuid = require('uuid/v4');

const WAV_FILENAME = "hive-sound.wav";

//
// Callback when device connected, sets up the message sending loop
//
var connect = function (err) {
  if (err) {
    console.log('### Could not connect: ' + err);
  } else {
    console.log('### Device connected');

    // Call the collect() function every interval, loops forever
    setInterval(collectData, config.pollInterval * 1000);
  }
};


//
// Collect data and send to IOT hub
//
async function collectData() {
  let temperature = 32.79;
  let humidity = 45.233;
  let airQuality = 23.601;
  let soundDb = NaN;

  console.log(`### ${new Date()} starting data collection...`);
  
  // Start sound capture
  let SoundCapture = require('./sound');
  let capture = new SoundCapture(2000, WAV_FILENAME);
  await capture.record();

  sleep(300);

  // Analyse sound using ffmpeg command, finding peak level
  try {
    let out = await executePromise(`ffmpeg -i /tmp/${WAV_FILENAME} -af astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level -f null -`);
    let m = out.stderr.match(/Peak level dB:\s(.*?)\n/i);
    //console.log(out.stderr);
    soundDb = parseFloat(m[1]);
    if(soundDb < -100.0) soundDb = NaN;
  } catch (error) {
    console.log(error);
  }

  // Get temperature & humidity
  try {
    let out = await executePromise(`python ${config.dhtScript} ${config.dhtGpioPin}`);
    let dhtValues = out.stdout.split(',');

    console.log('### Got data from DHT22 sensor');
    humidity = parseFloat(dhtValues[0].trim());
    temperature = parseFloat(dhtValues[1].trim());
  } catch (error) {
    console.log(error);
  }

  // Format message object
  var msg = JSON.stringify({
    deviceId: config.iotDeviceId,
    uuid: uuid(),
    data: { 
      temperature: temperature,
      humidity: humidity,
      airQuality: airQuality,
      soundDb: soundDb
    }
  });

  // Now send message to Azure
  var message = new Message(msg);
  console.log(`### ${new Date()} sending message: ` + message.getData());
  client.sendEvent(message);
}


//
// Entry point
//
client.open(connect);


//
// Helper functions here...
//
function executePromise(script) {
  return new Promise((resolve, reject) => {
    require('child_process').exec(script, (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
      } else {
        // Weird case with ffmpeg that output we need is in stderr!!
        resolve({ stdout: stdout, stderr: stderr });
      }
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}