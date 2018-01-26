var tempGauge;
var humidGauge;
var motionGauge;
var soundGauge;
const REFRESH_RATE = 5;   // In seconds

//
// Setup the gauges 
//
function initAllGauges() {
  tempGauge = setUpGauge('tempGauge', 0, 100, 0.5, 0.75);
  humidGauge = setUpGauge('humidGauge', 0, 100, 0.8, 0.9);
  motionGauge = setUpGauge('motionGauge', 0, 1, 1, 1);
  soundGauge = setUpGauge('soundGauge', 0, 30, 1, 1);

  tempGauge.setTextField(document.getElementById('tempVal'), 3);
  humidGauge.setTextField(document.getElementById('humidVal'), 1);
  motionGauge.setTextField(document.getElementById('motionVal'), 2);
  soundGauge.setTextField(document.getElementById('soundVal'), 2);

  setInterval(refreshData, REFRESH_RATE * 1000);
}


//
// Setup a new gauge 
//
function setUpGauge(gaugeId, min, max, c1, c2) {
  var opts = {
    angle: -0.15, 
    lineWidth: 0.3, 
    radiusScale: 1, 
    pointer: {
      length: 0.5, 
      strokeWidth: 0.045, 
      color: '#444' 
    },
    limitMax: false,     
    limitMin: false,     
    strokeColor: '#ddd',  
    generateGradient: true,
    highDpiSupport: true,     
    fontSize: 40,
    staticZones: [
      {strokeStyle: "#30B32D", min: 0, max: c1 * max}, 
      {strokeStyle: "#FFDD00", min: c1 * max, max: c2 * max}, 
      {strokeStyle: "#F03E3E", min: c2 * max, max: max}  
   ]
  };
  
  var gauge = new Gauge(document.getElementById(gaugeId)).setOptions(opts); 
  gauge.maxValue = max; 
  gauge.setMinValue(min);  
  gauge.animationSpeed = 32; 
  return gauge;
}

function selectHive(hive) {
  activeHive = hive;
  console.log(`### Selected hive: ${JSON.stringify(activeHive)}`)

  try {
    map.setView({
      center: new Microsoft.Maps.Location(activeHive.location[0], activeHive.location[1]),
    });
  } catch(e) {}

  document.getElementById('hiveName').innerText = activeHive.name;
  refreshData();
}


//
// Main data refresh function
//
function refreshData() {
  // If no hive selected, skip
  if(!activeHive) return;

  // Make REST API call and fetch current data 
  fetch(`${API_ENDPOINT}/hiveData/${activeHive.id}`)
  .then(res => {
    // Boo errors
    if (res.status !== 200) {
      console.log('### Hive data API HTTP error! Status Code: ' +res.status);
      error("No data found in the past hour for this hive");
      return;
    }
    
    // Otherwise ensure gauges are shown and update with fetched data
    showGauges();
    res.json().then(function(data) {
      // Update gauges with current values
      tempGauge.set(data.currentData.temperature);
      humidGauge.set(data.currentData.humidity);
      motionGauge.set(data.currentData.motionLevel);
      soundGauge.set(data.currentData.soundLevel);
    
      // Calculate and show delta trend from previous measure
      if(data.prevData.hasOwnProperty('temperature')) {
        let delta = data.currentData.temperature - data.prevData.temperature;
        let sym = delta < 0 ? '<i class="fa fa-arrow-down"></i>' : '<i class="fa fa-arrow-up"></i>';
        $('#tempInfo').html(`${sym} ${Math.abs(delta.toFixed(2))}`);
        delta = data.currentData.humidity - data.prevData.humidity;
        sym = delta < 0 ? '<i class="fa fa-arrow-down"></i>' : '<i class="fa fa-arrow-up"></i>';
        $('#humInfo').html(`${sym} ${Math.abs(delta.toFixed(2))}`);
      }
    });
  })
  .catch(function(err) {
    console.log('### Hive data API fetch error!', err);
  });  
}

//
// Hide gauges and display an error
//
function error(msg) {
  $('#gauges').hide();
  $('#error').show();
  $('#error').text(msg);
}

//
// Show gauges and hide error message
//
function showGauges() {
  $('#gauges').show();
  $('#error').hide();
}
