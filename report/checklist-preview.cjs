const fs=require('fs'),babel=require('@babel/core'),React=require('react'),RN=require('react-native-web'),assert=require('assert/strict');
const {renderToStaticMarkup}=require('react-dom/server');
const {chromium}=require('../../server/node_modules/playwright');
function load(file,deps={}){const m={exports:{}};const code=babel.transformSync(fs.readFileSync(file,'utf8'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-modules-commonjs','@babel/plugin-transform-react-jsx']}).code;new Function('require','module','exports',code)(n=>n in deps?deps[n]:require(n),m,m.exports);return m.exports;}
const Colors=load('src/styles/color.js').default;
const Modal=({visible,children})=>visible?React.createElement(RN.View,{style:{position:'absolute',inset:0}},children):null;
const ChecklistEntryModal=load('src/components/task/checklistEntryModal.js',{'react-native':{...RN,Modal},'react-native-safe-area-context':{SafeAreaView:RN.View},'../../styles/color':Colors}).default;
function find(node,check){if(!React.isValidElement(node))return null;if(check(node))return node;for(const child of React.Children.toArray(node.props.children)){const r=find(child,check);if(r)return r;}return null;}
for(const item of [false,true]){
 let sent=[],closed=0;
 const props={visible:true,item,value:'  Review design  ',onChangeText(){},onAdd:v=>sent.push(v),onClose:()=>closed++};
 const input=tree=>find(tree,n=>n.type===RN.TextInput);
 let tree=ChecklistEntryModal(props);assert.equal(input(tree).props.maxLength,item?500:255);input(tree).props.onSubmitEditing();assert.deepEqual(sent,['Review design']);
 for(const overrides of [{value:''},{value:'   '},{busy:true},{locked:true},{value:'x'.repeat(item?501:256)}])input(ChecklistEntryModal({...props,...overrides})).props.onSubmitEditing();
 assert.equal(sent.length,1);tree.props.onRequestClose();assert.equal(closed,1);ChecklistEntryModal({...props,busy:true}).props.onRequestClose();assert.equal(closed,1);
}
function html(mode,item){
 const value=mode==='empty'?'':mode==='spaces'?'   ':mode==='long'?'Review design '.repeat(10):'Review design';
 const App=()=>React.createElement(RN.View,{style:{height:'100vh'}},
 React.createElement(RN.View,{style:{flex:1,padding:24,backgroundColor:Colors.white}},React.createElement(RN.Text,{style:{fontSize:22,fontWeight:'600'}},'Task Detail'),React.createElement(RN.Text,{style:{fontSize:16,marginTop:32}},'Checklist')),
 React.createElement(ChecklistEntryModal,{visible:true,item,value,onChangeText(){},onAdd(){},onClose(){},busy:mode==='busy',locked:mode==='locked'}));
 RN.AppRegistry.registerComponent('ChecklistPreview',()=>App);const {element,getStyleElement}=RN.AppRegistry.getApplication('ChecklistPreview');const markup=renderToStaticMarkup(element);
 return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+renderToStaticMarkup(getStyleElement())+'</head><body style="margin:0">'+markup+'</body></html>';
}
(async()=>{
 fs.mkdirSync('report/checklist-ui',{recursive:true});const browser=await chromium.launch({headless:true});
 try{const page=await browser.newPage();
 for(const item of [false,true])for(const [width,height] of [[320,640],[390,844],[1280,800],[640,320]])for(const mode of ['default','empty','spaces','busy','locked','long']){
  await page.setViewportSize({width,height});await page.setContent(html(mode,item));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const input=page.getByRole('textbox');assert.equal(await input.getAttribute('maxlength'),item?'500':'255');
  const add=page.getByRole('button',{name:mode==='busy'?'Adding...':'Add',exact:true});
  assert.equal(await add.getAttribute('aria-disabled'),['empty','spaces','busy','locked'].includes(mode)?'true':null);
  const dialog=await input.locator('xpath=../..').boundingBox();assert.ok(Math.abs(dialog.y+dialog.height/2-height/2)<3,'Centered dialog');
  if(mode==='default'){const field=await input.boundingBox();const action=await add.boundingBox();assert.ok(action.y-field.y-field.height<=25,'Compact action spacing');}
  if(width===390&&['default','empty','busy'].includes(mode))await page.screenshot({path:`report/checklist-ui/${item?'item':'checklist'}-${mode}-390.png`,fullPage:true});
 }
 console.log('PASS checklist and item: trimmed submission, required/length/busy/locked guards, back dismissal; RN Web SSR centered layouts at 320/390/1280/landscape, white inputs, compact actions. Modal/SafeArea adapters used; native keyboard/API not exercised.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
