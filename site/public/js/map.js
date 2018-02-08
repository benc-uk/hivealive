const BINGMAP_API_KEY = 'AmnWtLClx6Sr2XKPwi1LFHrZDuCpH2jPZjbhzyMpC6aQN_dgQfaUVGCnJhGNX67L'

var map;

function initMap() {
  map = new Microsoft.Maps.Map('#hiveMap', {
    credentials: BINGMAP_API_KEY,
    disablePanning: false,
    disableStreetside: true,
    showMapTypeSelector: false,
    showZoomButtons: true,
    showLocateMeButton: false
  });

  map.setView({
    mapTypeId: Microsoft.Maps.MapTypeId.aerial,
    center: new Microsoft.Maps.Location(hives[0].location[0], hives[0].location[1]),
    zoom: 18,
  });

  hives.forEach(h => {
    addHivetoMap(h);
  });
}

function addHivetoMap(hive) {
  
  // Hacky choice of hive vs hub based on name for now
  if(hive.id.startsWith('hub-')) {
    var iconImg = '/public/img/hub.png'
  } else {
    var iconImg = '/public/img/hive-48.png'
  }
  var pin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(hive.location[0], hive.location[1]), {
    title: hive.name,
    icon: iconImg,
    anchor: new Microsoft.Maps.Point(16, 16)
  });

  map.entities.push(pin);
  pin.metadata = {hive: hive};
  Microsoft.Maps.Events.addHandler(pin, 'click', e => { selectHive(e.target.metadata.hive) });
}