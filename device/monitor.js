//
// HiveAlive RaspberryPi IOT monitoring
// Ben Coleman, 2018
//

// Load config
var config = JSON.parse(require('fs').readFileSync("config.json"));

// Static config values
const WAV_PATH = "/tmp/hive-sound.wav";
const LOG = "./logs/monitor.log";
const BME680_SCRIPT = "./py/bme680-collect.py";
const GAS_BASELINE = 250000.0;
const HUMID_BASELINE = 20.0;
const HUMID_WEIGHT = 0.25;

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
log.setLevel('info');

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

  // Call the BME680 sensor to get temperature, humidity, pressure and air quality
  try {
    let out = await utils.executeCommand(`python ${BME680_SCRIPT} ${config.bmeTime}`);
    let dhtValues = out.stdout.split(',');

    log.info('Got data from BME680 sensor');
    temperature = parseFloat(dhtValues[0].trim());
    pressure = parseFloat(dhtValues[1].trim());
    humidity = parseFloat(dhtValues[2].trim());
    gasResist = parseFloat(dhtValues[3].trim());

    var humidOffset = humidity - HUMID_BASELINE;
    var humidScore;
    if(humidOffset > 0) {
      humidScore = (100 - HUMID_BASELINE - humidOffset) / (100 - HUMID_BASELINE) * (HUMID_WEIGHT * 100);
    } else {
      humidScore = (HUMID_BASELINE + humidOffset) / HUMID_BASELINE * (HUMID_WEIGHT * 100);
    }

    var gasOffset = GAS_BASELINE - gasResist;
    var gasScore;
    if (gasOffset > 0) {
      gasScore = (gasResist / GAS_BASELINE) * (100 - (HUMID_WEIGHT * 100));
    } else {
      gasScore = 100 - (HUMID_WEIGHT * 100);
    }
    airQuality = humidScore + gasScore;

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
      soundDb: soundDb,
      pressure: pressure
    }
  });

  // Now send message to Azure
  var message = new Message(msg);
  if(!collectError) {
    log.info(`Sending message to Azure: ${message.getData()}`);
    client.sendEvent(message, (err, res) => {
      if(err) {
        log.error(`IOT HUB ERROR ${JSON.stringify(err)}`)
      } else {
        log.trace(`IOT RESULT ${JSON.stringify(res)}`);
      }
    });
  } else {
    log.error(`Skipping message sending due to error`);  
  }
}

//
// Entry point
//
log.info(`Device started with config: ${JSON.stringify(config)}`);
client.open(connect);
