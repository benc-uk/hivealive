'use strict';

// Grab input parameters from command line, four required params:
//  {iot-hub-hostname} {device-id} {device-key} {send-interval-ms}
var args = process.argv.slice(2);
var hostname = args[0];
var device = args[1];
var device_key = args[2];
var interval = parseFloat(args[3]);

console.log(`### Starting to send data to '${hostname}' from device '${device}', at interval ${interval}millsec`);

// IoT connection stuff
var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
var Message = require('azure-iot-device').Message;
var uuid = require('uuid/v4');
var connectionString = 'HostName=' + hostname + ';DeviceId=' + device + ';SharedAccessKey=' + device_key;
var client = clientFromConnectionString(connectionString);

// Initial simulated data
var tempPrev = 32;
var humPrev = 50;

//
// Callback when device connected, sets up the message sending loop
//
var connectCallback = function (err) {
   if (err) {
      console.log('### Could not connect: ' + err);
   } else {
      console.log('### Client ('+device+') connected');

      // Call the sendMessage() function every interval, loops forever
      setInterval(sendMessage, interval);
   }
};

//
// Send a message to the IoT hub
//
function sendMessage() {
   let t = tempPrev + (Math.random() * 12) - 6; tempPrev = t;
   let h = humPrev + (Math.random() * 40) - 20; humPrev = h

   var msg = JSON.stringify({ 
      deviceId: device, 
      uuid: uuid(), 
      data: {
         temperature: t,
         humidity: h,
         motionLevel: Math.random(),
         soundLevel: 8 + (Math.random() * 7),
         soundFreq: 800 + (Math.random() * 800)
      }
   });

   var message = new Message(msg);
   console.log(`### ${new Date()} message: ` + message.getData());
   client.sendEvent(message, printResultFor('send'));
}


//
// Callback for printing results
//
function printResultFor(op) {
   return function printResult(err, res) {
      if (err) console.log(op + ' error: ' + err.toString());
      if (res) console.log(op + ' status: ' + res.constructor.name);
   };
}

//
// Entry point
//
client.open(connectCallback);