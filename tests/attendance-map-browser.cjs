const fs=require('fs'), assert=require('assert/strict'), http=require('http'), babel=require('@babel/core');
const {chromium}=require('../../server/node_modules/playwright');
const mod={exports:{}};
const code=babel.transformSync(fs.readFileSync('src/utils/attendanceMapHtml.js','utf8'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code;
new Function('module','exports',code)(mod,mod.exports);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const component={exports:{}};
const componentCode=babel.transformSync(fs.readFileSync('src/components/attendanceMap.web.js','utf8'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-modules-commonjs','@babel/plugin-transform-react-jsx']}).code;
const dependencies={react:React,'../styles/color':{primary:'#7057FC'},'../utils/attendanceMapHtml':mod.exports};
new Function('require','module','exports',componentCode)(name=>dependencies[name],component,component.exports);
const markup=renderToStaticMarkup(React.createElement(component.exports.default,{location:{latitude:10.8703,longitude:106.8035},office:{latitude:10.870325,longitude:106.803575,radius:200}}));
const wrapped=`<!doctype html><html><body style="margin:0"><div style="height:400px">${markup}</div></body></html>`;
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(wrapped);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:430}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let tileReferer;
  page.on('request',r=>{if(r.url().startsWith('https://tile.openstreetmap.org/'))tileReferer=r.headers().referer;});
  let tileSuccess=0;page.on('response',r=>{if(r.url().startsWith('https://tile.openstreetmap.org/')&&r.ok())tileSuccess++;});
  await page.goto('http://127.0.0.1:'+server.address().port);
  const frame=page.frames()[1];
  try{await frame.waitForFunction(()=>document.querySelector('.leaflet-tile-loaded'),{},{timeout:30000});}catch(e){console.log('Frame text:',await frame.locator('body').innerText());console.log('Script errors:',errors);throw e;}
  assert.match(await frame.locator('.leaflet-control-attribution').innerText(),/OpenStreetMap contributors/);
  assert.equal(await frame.locator('path.leaflet-interactive').count(),2);
  assert.ok(tileReferer?.startsWith('http://127.0.0.1:'), 'OSM requests must identify the real web origin');
  await page.screenshot({path:'.expo/attendance-osm-browser.png'});
  console.log('PASS real Leaflet + OSM tiles, GPS marker, office radius, visible attribution; successful tile responses:',tileSuccess);
  await page.route('https://tile.openstreetmap.org/**',route=>route.abort());
  await frame.evaluate(()=>tiles.redraw());
  await frame.locator('#retry').waitFor({state:'visible'});
  console.log('PASS tile failure displays retry');
  await page.unroute('https://tile.openstreetmap.org/**');
  await frame.locator('#retry').click();
  await frame.locator('#status').waitFor({state:'hidden'});
  console.log('PASS tile retry recovers');
  await page.route('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',route=>route.abort());
  await page.reload();
  const offline=page.frames()[1];await offline.locator('#retry').waitFor({state:'visible'});
  await page.unroute('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
  await offline.locator('#retry').click();
  await offline.waitForFunction(()=>document.querySelector('.leaflet-tile-loaded'));
  console.log('PASS library failure and retry recovery');
  assert.deepEqual(errors,[]);console.log('PASS no browser script errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
