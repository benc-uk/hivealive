var tempGauge;
var humidGauge;
var airGauge;
var soundGauge;
const REFRESH_RATE = 15;   // In seconds

//
// Setup the gauges 
//
function initAllGauges() {
  tempGauge = setUpGauge('tempGauge', -10, 50, -10, 38, 45);
  humidGauge = setUpGauge('humidGauge', 0, 100, 0, 60, 90);
  airGauge = setUpGauge('airGauge', 0, 100, 0, 10, 20, true);
  soundGauge = setUpGauge('soundGauge', -80, 0, -80, -35, -15);

  tempGauge.setTextField(document.getElementById('tempVal'), 3);
  humidGauge.setTextField(document.getElementById('humidVal'), 1);
  airGauge.setTextField(document.getElementById('airVal'), 2);
  soundGauge.setTextField(document.getElementById('soundVal'), 2);

  setInterval(refreshData, REFRESH_RATE * 1000);
}


//
// Setup a new gauge 
//
function setUpGauge(gaugeId, min, max, t0, t1, t2, reverse) {
  var staticZones = [
    { strokeStyle: "#30B32D", min: t0, max: t1 },
    { strokeStyle: "#FFDD00", min: t1, max: t2 },
    { strokeStyle: "#F03E3E", min: t2, max: max }
  ]
  if(reverse) { 
    staticZones = [
      { strokeStyle: "#F03E3E", min: t0, max: t1 },
      { strokeStyle: "#FFDD00", min: t1, max: t2 },
      { strokeStyle: "#30B32D", min: t2, max: max }
    ]
  }

  var opts = {
    angle: -0.15,
    lineWidth: 0.3,
    radiusScale: 1,
    pointer: {
      length: 0.5,
      strokeWidth: 0.045,
      color: '#444'
    },
    colorStart: '#342356',
    limitMax: false,
    limitMin: false,
    strokeColor: '#ddd',
    generateGradient: true,
    highDpiSupport: true,
    fontSize: 40,
    staticZones: staticZones
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

  if(activeHive.id.startsWith('hub-')) {
    $('#hubinfo').empty();
    fetch(`https://cors-anywhere.herokuapp.com/${API_WEATHER}/${activeHive.location[0]},${activeHive.location[1]}?units=uk2&exclude=minutely,hourly,daily,alerts`)
    .then(res => {
      res.json()
      .then(weather => {
        for(p in weather.currently) {
          if(p == 'time' || p == 'icon') continue;
          var prop = p.replace( /([A-Z])/g, " $1" );
          prop = prop.charAt(0).toUpperCase() + prop.slice(1);
          $('#hubinfo').append(`<tr><td>${prop}:&nbsp;&nbsp;&nbsp;&nbsp;</td><td>${weather.currently[p]}</td></tr>`)
        }
        var skycons = new Skycons({ "color": "#333" });
        console.log(weather.currently.icon);     
        skycons.add("weather_icon", weather.currently.icon);
        skycons.play();
      })
      .catch(err => {console.log(err) } );
    })
    .catch(err => { console.log(err) });

    showHub();
    return;
  }

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
      airGauge.set(data.currentData.airQuality);
      soundGauge.set(data.currentData.soundDb);
    
      // Calculate and show delta trend from previous measure
      if(data.prevData.hasOwnProperty('temperature')) {
        let delta = data.currentData.temperature - data.prevData.temperature;
        let sym = delta < 0 ? '<i class="fa fa-arrow-down"></i>' : '<i class="fa fa-arrow-up"></i>';
        $('#tempInfo').html(`${sym} ${Math.abs(delta.toFixed(2))}`);

        delta = data.currentData.humidity - data.prevData.humidity;
        sym = delta < 0 ? '<i class="fa fa-arrow-down"></i>' : '<i class="fa fa-arrow-up"></i>';
        $('#humInfo').html(`${sym} ${Math.abs(delta.toFixed(2))}`);

        delta = data.currentData.airQuality - data.prevData.airQuality;
        sym = delta < 0 ? '<i class="fa fa-arrow-down"></i>' : '<i class="fa fa-arrow-up"></i>';
        $('#airInfo').html(`${sym} ${Math.abs(delta.toFixed(2))}`);

        delta = data.currentData.soundDb - data.prevData.soundDb;
        sym = delta < 0 ? '<i class="fa fa-arrow-down"></i>' : '<i class="fa fa-arrow-up"></i>';
        $('#soundInfo').html(`${sym} ${Math.abs(delta.toFixed(2))}`);                
      }

      // Update info
      let dateTime = new Date(data.currentData.Timestamp);
      $('#info').html(`Data timestamp: ${dateTime.toGMTString()}`);
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
  $('#hubinfo').hide();
  $('#error').show();
  $('#error').text(msg);
}

//
// Show gauges and hide error message
//
function showGauges() {
  $('#gauges').show();
  $('#hubinfo').hide();
  $('#error').hide();
}

//
// Show weather info for hub and hide error message
//
function showHub() {
  $('#hubinfo').show();
  $('#gauges').hide();
  $('#error').hide();
}