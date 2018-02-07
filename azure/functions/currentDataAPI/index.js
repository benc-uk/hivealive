var azure = require('azure-storage');
const TABLE = 'hiveData';
const ACCOUNT = process.env.STORAGE_ACCOUNT;
const KEY = process.env.STORAGE_KEY;
const TIME_WINDOW = 1 * 60 * 60 * 1000;

module.exports = function (context, req) {
    let hive = req.params.hiveId;

    context.log(`### Request for latest data for hive: ${hive}`);

    let tableSvc = azure.createTableService(ACCOUNT, KEY);

    let startTime = new Date().getTime() - TIME_WINDOW;
    let startDate = new Date();
    startDate.setTime(startTime);
    context.log(`### Start time ${startDate.toISOString()}`);
    let query = new azure.TableQuery()
        .where(`PartitionKey eq '${hive}' and Timestamp ge datetime'${startDate.toISOString()}'`);

    try {
        tableSvc.queryEntities(TABLE, query, null, function(error, result, response) {
            if(!error) {

                var data = [];
                var status = 404;
                if(result.entries.length > 0) {
                    context.log(`### Entries ${result.entries.length}`);
                    let sorted = result.entries.sort(function(a, b) {
                        aDate = new Date(a.Timestamp['_']);
                        bDate = new Date(b.Timestamp['_']);
                        return (bDate - aDate);
                    });

                    let latestFlat = flattenRow(sorted[0]);
                    //context.log(sorted[0]);
                    let prevFlat = {};
                    if(sorted.length > 1) {
                        prevFlat = flattenRow(sorted[1]);
                    }
                    data = {
                        hiveId: sorted[0].PartitionKey['_'],
                        currentData: latestFlat,
                        prevData: prevFlat
                    }
                    status = 200;
                }
                context.res = {
                    status: status,
                    body: data,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                };   
                context.done();       
            } else {
                context.log(`### Error: ${JSON.stringify(error)}`);
                context.done();
            }
        });
    } catch(e) {
        context.log(`### Severe Error: ${JSON.stringify(e)}`);
        context.done();
    }
};

function flattenRow(row) {
    var d = {};
    for (var p in row) {
        if(p == 'PartitionKey' || p == 'RowKey') continue;     
        d[p] = row[p]['_'];
    }
    return d;   
}