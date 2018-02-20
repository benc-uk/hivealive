var util = require('util');

module.exports = function (context, IoTHubMessages) {
  
    context.bindings.outputTable = [];
    var msg = null;

    IoTHubMessages.forEach(message => {
        context.log(`### Received message ${message.deviceId}, ${message.uuid}`);
        var newrow = {PartitionKey: message.deviceId, RowKey: message.uuid};

        // Grab all properties from the data in the message and copy to table row
        // We don't care what the properties are called
        for(p in message.data) {
            newrow[p] = message.data[p];
        }

        context.bindings.outputTable.push(newrow);

        // Check thresholds

        // This is *really* bad & hacky way of handling the alerts, 
        // Even by POC standards!
        var alert = false;
        if(parseFloat(message.data.temperature) > 30) alert = true;
        if(parseFloat(message.data.humidity) > 70) alert = true;

        if(alert) {
            context.log('### Sending alert email!');
            msg = {
                subject: "Alert from HiveAlive",
                content: [{
                    type: 'text/plain',
                    value: `Warning! Sensors in your hive ${message.deviceId} have detected readings that breech your thresholds`
                }]
            }
        }
    });

    context.done(null, {
        message: msg
    });
};