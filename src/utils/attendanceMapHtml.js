// This document only displays coordinates. GPS and attendance validation stay native/server-side.
export function createAttendanceMapHtml(location, office, primary = '#7057FC') {
  const validPoint = point => point && Number.isFinite(point.latitude) &&
    Math.abs(point.latitude) <= 90 && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
  if (!validPoint(location) || !validPoint(office) || !Number.isFinite(office.radius) || office.radius <= 0) {
    throw new Error('Invalid attendance map coordinates');
  }
  const color = /^#[0-9a-f]{6}$/i.test(primary) ? primary : '#7057FC';
  const data = JSON.stringify({
    position: [location.latitude, location.longitude],
    office: [office.latitude, office.longitude], radius: office.radius,
    color,
  });
  return `<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https://unpkg.com; style-src 'unsafe-inline' https://unpkg.com; img-src data: https://tile.openstreetmap.org;">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<style>
html,body,#map{height:100%;width:100%;margin:0}body{background:#f0f1f7;font:14px sans-serif}
#status{position:absolute;z-index:1000;top:12px;left:55px;right:12px;background:white;padding:10px;border-radius:12px;color:#101828}
#retry{min-height:44px;color:${color};background:white;border:0;font-weight:bold}
.leaflet-control-attribution{font-size:11px}.leaflet-container{background:#f0f1f7}
</style></head><body><div id="map" aria-label="Your location and permitted clock-in area"></div>
<div id="status" role="status"><span id="message">Loading map…</span><button id="retry" hidden>Retry map</button></div>
<script>
const data=${data};
const status=document.getElementById('status'), message=document.getElementById('message'), retry=document.getElementById('retry');
let tiles, map;
function fail(){status.hidden=false;message.textContent='Map unavailable. Check your connection. GPS validation is unchanged.';retry.hidden=false;}
let timer=setTimeout(fail,15000);
function start(){
  if(map)return;
  clearTimeout(timer);
  if(!window.L){fail();return;}
  map=L.map('map').setView(data.position,16);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>');
  const area=L.circle(data.office,{radius:data.radius,color:data.color,fillColor:data.color,fillOpacity:0.2,weight:2}).addTo(map);
  L.circleMarker(data.position,{radius:9,color:'#ffffff',weight:3,fillColor:data.color,fillOpacity:1}).addTo(map).bindTooltip('Your GPS location');
  map.fitBounds(area.getBounds().extend(data.position),{padding:[24,24],maxZoom:17});
  tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,keepBuffer:0,updateWhenIdle:true,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
  });
  tiles.on('tileerror',fail);
  tiles.on('tileload',()=>{clearTimeout(timer);status.hidden=true;});
  timer=setTimeout(fail,15000);
  tiles.addTo(map);
}
function loadLibrary(){
  const script=document.createElement('script');
  script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
  script.crossOrigin='';script.onload=start;script.onerror=fail;document.head.appendChild(script);
}
retry.onclick=()=>{
  retry.hidden=true;message.textContent='Loading map…';clearTimeout(timer);timer=setTimeout(fail,15000);
  if(tiles){tiles.redraw();}else if(!map){loadLibrary();}
};
loadLibrary();
</script></body></html>`;
}
