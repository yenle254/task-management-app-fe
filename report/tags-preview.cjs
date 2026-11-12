const fs=require('fs'), babel=require('@babel/core'), React=require('react'), RN=require('react-native-web'), assert=require('assert/strict');
const {renderToStaticMarkup}=require('react-dom/server');
const {chromium}=require('../../server/node_modules/playwright');
function load(file,deps={}) {
 const m={exports:{}};
 const code=babel.transformSync(fs.readFileSync(file,'utf8'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-modules-commonjs','@babel/plugin-transform-react-jsx']}).code;
 new Function('require','module','exports',code)(n=>n in deps?deps[n]:require(n),m,m.exports);return m.exports;
}
const Colors=load('src/styles/color.js').default;
const statuses=load('src/utils/taskStatusMap.js',Object.fromEntries(['todo','inprogress','done'].map(n=>['../../assets/icons/'+n+'.svg',()=>null])));
const svg=tag=>({accessible,...props})=>React.createElement(tag,props);
const TaskTagsCard=load('src/components/task/taskTagsCard.js',{'react-native':RN,'react-native-svg':{__esModule:true,default:svg('svg'),Circle:svg('circle'),Path:svg('path')},'../../styles/color':Colors,'../../utils/taskStatusMap':statuses}).default;
// Exercise the component's real callbacks with controlled hook state; screenshots
// use real RN Web layout. This does not certify a native keyboard or live API.
function harness(initial=[], max=20, disabled=false) {
 const state=[]; let cursor=0, tags=initial;
 const hooks={...React,useState(init){const i=cursor++;if(!(i in state))state[i]=init;return [state[i],v=>state[i]=typeof v==='function'?v(state[i]):v];}};
 const {TagInput}=load('src/components/task/advancedTaskFields.js',{react:hooks,'react-native':RN,'./taskFormFields':{FormInput:()=>null},'./taskTagsCard':TaskTagsCard,'../../styles/color':Colors});
 return {render(){cursor=0;return TagInput({tags,max,disabled,onChange:next=>tags=next});},tags:()=>tags};
}
function find(node,predicate){
 if(!React.isValidElement(node))return null;
 if(predicate(node))return node;
 for(const child of React.Children.toArray(node.props.children)){const result=find(child,predicate);if(result)return result;}
 return null;
}
function input(h){return find(h.render(),n=>n.type===RN.TextInput);}
function button(h,label){return find(h.render(),n=>n.type===RN.TouchableOpacity&&React.Children.toArray(n.props.children).some(c=>c?.props?.children===label));}
const workflow=harness(['Frontend']);
assert.equal(input(workflow),null);
workflow.render().props.onEdit();input(workflow).props.onChangeText('  UI/UX  ');button(workflow,'Add').props.onPress();
assert.deepEqual(workflow.tags(),['Frontend','UI/UX']);assert.equal(input(workflow),null);
workflow.render().props.onEdit();input(workflow).props.onChangeText('Frontend');input(workflow).props.onSubmitEditing();assert.equal(workflow.tags().length,2);
workflow.render().props.onEdit();input(workflow).props.onChangeText('Discard');button(workflow,'Cancel').props.onPress();assert.equal(workflow.tags().length,2);
workflow.render().props.onRemove('Frontend');assert.deepEqual(workflow.tags(),['UI/UX']);
for(const max of [5,20]){
 const h=harness(Array.from({length:max},(_,i)=>'Tag '+i),max);h.render().props.onEdit();input(h).props.onChangeText('Extra');assert.equal(button(h,'Add').props.disabled,true);input(h).props.onSubmitEditing();assert.equal(h.tags().length,max);
 h.render().props.onRemove('Tag 0');button(h,'Add').props.onPress();assert.ok(h.tags().includes('Extra'));assert.equal(h.tags().length,max);
}
const locked=harness(['Frontend'],20,true);locked.render().props.onRemove('Frontend');assert.equal(locked.tags().length,1);
locked.render().props.onEdit();assert.equal(input(locked).props.editable,false);
const cases={empty:harness(),filled:harness(['Frontend','UI/UX','High Priority']),long:harness(['A long tag that should remain readable on a phone']),editor:harness(['Frontend']),limit:harness(['One','Two','Three','Four','Five'],5),disabled:locked};
cases.editor.render().props.onEdit();cases.limit.render().props.onEdit();
function html(h){
 const App=()=>React.createElement(RN.View,{style:{padding:16,backgroundColor:Colors.secondary}},h.render());
 RN.AppRegistry.registerComponent('TagPreview',()=>App);
 const {element,getStyleElement}=RN.AppRegistry.getApplication('TagPreview');const markup=renderToStaticMarkup(element);
 return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+renderToStaticMarkup(getStyleElement())+'</head><body style="margin:0">'+markup+'</body></html>';
}
(async()=>{
 fs.mkdirSync('report/tags-ui',{recursive:true});
 const browser=await chromium.launch({headless:true});
 try { const page=await browser.newPage();
 for(const width of [320,390,1280])for(const [name,h] of Object.entries(cases)){
  await page.setViewportSize({width,height:600});await page.setContent(html(h));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name} ${width} overflow`);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`report/tags-ui/${name}-${width}.png`,fullPage:true});
 }
 console.log('PASS tag callbacks: add/trim/deduplicate/cancel/remove, 5/20 limits, disabled mutations. PASS RN Web SSR layouts at 320/390/1280: empty/filled/editor/long/limit/disabled. Native interaction and API saves not exercised.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
