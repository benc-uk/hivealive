module.exports = function (context, IoTHubMessages) {
  
    context.bindings.outputTable = [];

    IoTHubMessages.forEach(message => {
        context.log(`### Received message ${message.deviceId}, ${message.uuid}`);
        var newrow = {PartitionKey: message.deviceId, RowKey: message.uuid};

        // Grab all properties from the data in the message and copy to table row
        // We don't care what the properties are called
        for(p in message.data) {
            newrow[p] = message.data[p];
        }

        context.bindings.outputTable.push(newrow);
    });

    context.done();
};