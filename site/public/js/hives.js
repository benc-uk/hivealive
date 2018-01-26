var tempGauge;
var humidGauge;
var motionGauge;
var soundGauge;
const REFRESH = 5;

function setUpGague(gagueId, min, max, c1, c2) {
  var opts = {
    angle: -0.15, // The span of the gauge arc
    lineWidth: 0.3, // The line thickness
    radiusScale: 1, // Relative radius
    pointer: {
      length: 0.5, // // Relative to gauge radius
      strokeWidth: 0.045, // The thickness
      color: '#444' // Fill color
    },
    limitMax: false,     // If false, max value increases automatically if value > maxValue
    limitMin: false,     // If true, the min value of the gauge will be fixed
    //colorStart: '#ff3333',   // Colors
    //colorStop: '#33ff33',    // just experiment with them
    strokeColor: '#ddd',  // to see which ones work best for you
    generateGradient: true,
    highDpiSupport: true,     // High resolution support
    fontSize: 40,
    staticZones: [
      {strokeStyle: "#30B32D", min: 0, max: c1*max}, // Green
      {strokeStyle: "#FFDD00", min: c1*max, max: c2*max}, // Yellow
      {strokeStyle: "#F03E3E", min: c2*max, max: max}  // Red
   ]
  };
  var target = document.getElementById(gagueId); // your canvas element
  var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
  gauge.maxValue = max; // set max gauge value
  gauge.setMinValue(min);  // Prefer setter over gauge.minValue = 0
  gauge.animationSpeed = 32; // set animation speed (32 is default value)
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

function initGauges() {
  tempGauge = setUpGague('tempGauge', 0, 100, 0.5, 0.75);
  humidGauge = setUpGague('humidGauge', 0, 100, 0.8, 0.9);
  motionGauge = setUpGague('motionGauge', 0, 1, 1, 1);
  soundGauge = setUpGague('soundGauge', 0, 30, 1, 1);

  tempGauge.setTextField(document.getElementById('tempVal'), 3);
  humidGauge.setTextField(document.getElementById('humidVal'), 1);
  motionGauge.setTextField(document.getElementById('motionVal'), 2);
  soundGauge.setTextField(document.getElementById('soundVal'), 2);

  setInterval(refreshData, REFRESH * 1000);
}

function refreshData() {
  //console.log(`### Refresh ${activeHive}`)
  if(!activeHive) return;
  fetch(`${API_ENDPOINT}/hiveData/${activeHive.id}`)
  .then(res => {
    if (res.status !== 200) {
      console.log('### Hive data API HTTP error! Status Code: ' +res.status);
      error();
      return;
    }
    
    showGauges();
    res.json().then(function(data) {
      tempGauge.set(data.currentData.temperature);
      humidGauge.set(data.currentData.humidity);
      motionGauge.set(data.currentData.motionLevel);
      soundGauge.set(data.currentData.soundLevel);
    });
  })
  .catch(function(err) {
    console.log('### Hive data API fetch error!', err);
  });  
}

function error() {
  document.getElementById('gauges').style.display = 'none';
  document.getElementById('error').style.display = 'block';
  document.getElementById('error').innerHTML = "No data found in the past hour for this hive"
}

function showGauges() {
  document.getElementById('gauges').style.display = 'block';
  document.getElementById('error').style.display = 'none';
}
