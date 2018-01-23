'use strict';

// Grab input parameters from command line, two required params:
//  {iot-hub-connstr} {device-id} 
var args = process.argv.slice(2);
var connstr = args[0];
var device_id = args[1];

// IoT connection stuff
var iothub = require('azure-iothub');
var registry = iothub.Registry.fromConnectionString(connstr);
var device = new iothub.Device(null);
device.deviceId = device_id;

//
// Register device with IoT hub
//
registry.create(device, function (err, deviceInfo, res) {
   if (err) {
      registry.get(device.deviceId, printDeviceInfo);
   }
   if (deviceInfo) {
      printDeviceInfo(err, deviceInfo, res)
   }
});

//
// Callback for printing results
//
function printDeviceInfo(err, deviceInfo, res) {
   if (deviceInfo) {
      console.log('Device ID: ' + deviceInfo.deviceId);
      console.log('Device key: ' + deviceInfo.authentication.symmetricKey.primaryKey);
   }
}