const fs=require('fs'), babel=require('@babel/core'), React=require('react'), RN=require('react-native-web');
const {renderToStaticMarkup}=require('react-dom/server');
const {chromium}=require('../../server/node_modules/playwright');
const assert=require('assert/strict');
function load(file,deps={}) {
 const m={exports:{}};
 const code=babel.transformSync(fs.readFileSync(file,'utf8'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-modules-commonjs','@babel/plugin-transform-react-jsx']}).code;
 new Function('require','module','exports',code)(n=>n in deps?deps[n]:require(n),m,m.exports);return m.exports;
}
const Colors=load('src/styles/color.js').default;
const advanced=load('src/components/task/advancedTaskFields.js',{'react-native':RN,'./taskFormFields':{},'../taskCategory':()=>null,'../appButton':()=>null});
const svg=tag=>({accessible,...props})=>React.createElement(tag,props);
const Modal=({visible,children})=>visible?React.createElement(RN.View,{style:{position:'absolute',inset:0}},children):null;
const EstimateModal=load('src/components/task/estimateModal.js',{'react-native':{...RN,Modal},'react-native-safe-area-context':{SafeAreaView:RN.View},'react-native-svg':{__esModule:true,default:svg('svg'),Circle:svg('circle'),Path:svg('path')},'../../styles/color':Colors,'./advancedTaskFields':advanced}).default;
function html(mode) {
 const values=mode==='invalid'?{estimatedMinutes:'-1',storyPoints:'3'}:{estimatedMinutes:'',storyPoints:''};
 const App=()=>React.createElement(RN.View,{style:{height:'100vh'}},
  React.createElement(RN.View,{style:{padding:24,backgroundColor:Colors.white,flex:1}},
   React.createElement(RN.Text,{style:{fontSize:22,fontWeight:'600'}},'Task Detail'),
   React.createElement(RN.Text,{style:{fontSize:18,marginTop:32}},'Project Website Redesign'),
   React.createElement(RN.Text,{style:{fontSize:16,marginTop:32}},'Estimate and time'),
   React.createElement(RN.Text,{style:{fontSize:14,marginTop:16}},'Estimate: Not set     Actual: 0 min')),
  React.createElement(EstimateModal,{visible:true,values,onChange(){},onSave(){},onClose(){},busy:mode==='busy'}));
 RN.AppRegistry.registerComponent('EstimatePreview',()=>App);
 const {element,getStyleElement}=RN.AppRegistry.getApplication('EstimatePreview');
 const markup=renderToStaticMarkup(element);
 return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+renderToStaticMarkup(getStyleElement())+'</head><body style="margin:0">'+markup+'</body></html>';
}
(async()=>{
 fs.mkdirSync('report/estimate-ui',{recursive:true});
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage();
  for(const [width,height] of [[320,640],[390,844],[1280,800],[640,320]]) {
   for(const mode of ['default','invalid','busy']) {
    await page.setViewportSize({width,height});await page.setContent(html(mode));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const cancel=page.getByRole('button',{name:'Cancel',exact:true});
    const save=page.getByRole('button',{name:mode==='busy'?'Saving…':'Save',exact:true});
    if(mode!=='default')assert.equal(await save.getAttribute('aria-disabled'),'true');
    if(mode==='busy')assert.equal(await cancel.getAttribute('aria-disabled'),'true');
    if(mode==='default'&&height>=640){
     const dialog=await page.getByText('Estimated Minutes',{exact:true}).locator('xpath=../../../..').boundingBox();
     assert.ok(Math.abs(dialog.y+dialog.height/2-height/2)<3,'Modal vertically centered');
    }
    await page.screenshot({path:`report/estimate-ui/${mode}-${width}.png`,fullPage:true});
   }
  }
  console.log('PASS layout: 320, 390, 1280 and short landscape; centered dialog, no overflow, invalid/busy Save disabled. SSR uses Modal/SafeArea and SVG adapters; no native keyboard or API interaction certification.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
