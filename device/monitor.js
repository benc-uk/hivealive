//
// HiveAlive RaspberryPi IOT monitoring
// Ben Coleman, 2018
//

// Load config
var config = JSON.parse(require('fs').readFileSync("config.json"));

// Static config values
const WAV_PATH = "/tmp/hive-sound.wav";
const LOG = "./logs/monitor.log";

// IoT connection stuff
var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
var Message = require('azure-iot-device').Message;
var connectionString = `HostName=${config.iotEndpoint};DeviceId=${config.iotDeviceId};SharedAccessKey=${config.iotDeviceKey}`;
var client = clientFromConnectionString(connectionString);

// OS and general Node things
const exec = require('child_process').exec;
var uuid = require('uuid/v4');
const utils = require('./utils');
const log = require('simple-node-logger').createSimpleLogger(LOG);

//
// Callback when device connected, sets up the message sending loop
//
var connect = function (err) {
  if (err) {
    log.error(`Could not connect: ${err}`);
  } else {
    log.info(`Device connected`);

    // Call the collect() function every interval, loops forever
    setInterval(collectData, config.pollInterval * 1000);
    
    // Initial call at startup
    collectData();
  }
};

//
// Collect data and send to IOT hub
//
async function collectData() {
  let temperature = NaN;
  let humidity = NaN;
  let airQuality = 23.601;
  let soundDb = NaN;
  let collectError = false

  log.info(`Starting data collection...`);
  
  // Start sound capture using arecord
  try {
    log.info(`Capturing ${config.soundLength} seconds of audio...`);
    let out = await utils.executeCommand(`arecord -D ${config.soundDev} -d ${config.soundLength} -f ${config.soundFormat} -r ${config.soundRate} ${WAV_PATH}`);
  } catch (error) {
    collectError = true;
    log.error(error);
  }  

  utils.sleep(300); // Small delay helps prevent errors, file not closed, etc

  // Analyse sound using ffmpeg command, finding peak level
  try {
    let out = await utils.executeCommand(`ffmpeg -i ${WAV_PATH} -af astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level -f null -`);
    let m = out.stderr.match(/RMS peak dB:\s(.*?)\n/i);
    
    soundDb = parseFloat(m[1]);

    // Filter outlier values
    if(soundDb < -100.0 || soundDb > 0) soundDb = NaN;
  } catch (error) {
    collectError = true;
    log.error(error);
  }

  // Get temperature & humidity
  try {
    let out = await utils.executeCommand(`python ${config.dhtScript} ${config.dhtGpioPin}`);
    let dhtValues = out.stdout.split(',');

    log.info('Got data from DHT22 sensor');
    humidity = parseFloat(dhtValues[0].trim());
    temperature = parseFloat(dhtValues[1].trim());

    // Filter outlier values
    if(humidity > 100) humidity = NaN;
    if(temperature < -10 || temperature > 60) temperature = NaN;    
  } catch (error) {
    collectError = true;
    log.error(error);
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
  if(!collectError) {
    log.info(`Sending message to Azure: ${message.getData()}`);
    client.sendEvent(message);
  } else {
    log.error(`Skipping message sending due to error`);  
  }
}

//
// Entry point
//
log.info(`Device started with config: ${JSON.stringify(config)}`);
client.open(connect);

