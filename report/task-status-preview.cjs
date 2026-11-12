const fs=require('fs'),babel=require('@babel/core'),React=require('react'),RN=require('react-native-web'),assert=require('assert/strict');
const {renderToStaticMarkup}=require('react-dom/server');
const {chromium}=require('../../server/node_modules/playwright');
const Empty=()=>null;
function load(file,deps={},extra=''){
 const m={exports:{}};const source=fs.readFileSync(file,'utf8')+extra;
 const code=babel.transformSync(source,{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-modules-commonjs','@babel/plugin-transform-react-jsx']}).code;
 new Function('require','module','exports',code)(name=>name in deps?deps[name]:Empty,m,m.exports);return m.exports;
}
const Colors=load('src/styles/color.js').default;
const statusModule=load('src/utils/taskStatusMap.js');
const nav={useNavigation:()=>({goBack(){},navigate(){}}),useRoute:()=>({params:{taskId:'sample'}}),useFocusEffect(){}};
const auth={useAuth:()=>({user:{_id:'observer',role:'employee'},canManageTasks:()=>false})};
let currentStatus='todo';
const task=()=>({_id:'sample',title:'Website redesign',status:currentStatus,priority:'medium',createdAt:'2026-11-04T10:00:00Z',dueDate:'2026-11-25T10:00:00Z',assignedTo:[],assignedBy:{_id:'owner'},attachments:[],subtasks:[],comments:[],description:'Review the latest design.'});
const shared={react:React,'react-native':RN,'react-native-safe-area-context':{SafeAreaView:RN.View},'@react-navigation/native':nav,'@/src/contexts/authContext':auth,'../../contexts/authContext':auth,'../../styles/color':Colors,'../../utils/taskStatusMap':statusModule,'../../../store/taskStore':()=>({selectedTask:task(),fetchTaskById:async()=>{}})};
const Detail=load('src/screens/task/taskDetailScreen.js',{...shared,'../../../chat_bot':{AITaskBreakdownPanel:Empty},'../../utils/fileUrlHelper':{getAbsoluteFileUrl:v=>v},'../../utils/downloadHelper':{downloadFile:Empty},'../../components/headerWithBackButton':()=>React.createElement(RN.Text,{style:{fontSize:20,fontWeight:'bold',padding:20}},'Task Details')}).default;
const category=load('src/components/taskCategory.js',{react:React,'react-native':RN,'../utils/categoryMapping':{CategoryMap:{},DefaultCategory:Empty}}).default;
const Card=load('src/components/task/cardTask.js',{...shared,'./../taskCategory':category}).default;
const dateKey=d=>d.toISOString().slice(0,10);
const calendar=load('src/screens/task/taskCalendarScreen.js',{...shared,'../../components/task/taskFilterBar':{dateKey}},'\nexport { getDotColor, getCardAccent };');
const timeline=load('src/screens/task/taskTimelineScreen.js',{...shared,'../../components/task/taskFilterBar':{dateKey}},'\nexport { getBarColors, getRowMeta };');
const picker=load('src/components/task/taskPickerModal.js',shared,'\nexport { statusMeta };');
for(const [key,meta] of Object.entries(statusModule.taskStatusMap)){
 const item={status:key,dueDate:'2030-01-01T00:00:00Z'};
 assert.equal(calendar.getDotColor(key),meta.color);
 assert.equal(calendar.getCardAccent(item,'2030-01-01').text,meta.color);
 assert.equal(timeline.getRowMeta(item,'2000-01-01').text,meta.color);
 assert.deepEqual(timeline.getBarColors(item),{bg:meta.bgColor,text:meta.color});
 assert.equal(picker.statusMeta(key).color,meta.color);assert.equal(picker.statusMeta(key).bg,meta.bgColor);
}
assert.equal(picker.statusMeta('unknown').label,'unknown');
function html(){
 const App=()=>React.createElement(RN.View,{style:{backgroundColor:Colors.secondary}},
 React.createElement(RN.View,{style:{padding:16}},React.createElement(Card,{name:'Website redesign',category:currentStatus,flag:'medium',description:'List card',progress:0,assignees:[]})),
 React.createElement(Detail));
 RN.AppRegistry.registerComponent('StatusPreview',()=>App);const {element,getStyleElement}=RN.AppRegistry.getApplication('StatusPreview');const body=renderToStaticMarkup(element);
 return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+renderToStaticMarkup(getStyleElement())+'</head><body style="margin:0">'+body+'</body></html>';
}
(async()=>{
 fs.mkdirSync('report/status-ui',{recursive:true});const browser=await chromium.launch({headless:true});
 try{const page=await browser.newPage();for(const width of [390,1280])for(const [key,meta] of Object.entries(statusModule.taskStatusMap)){
  currentStatus=key;await page.setViewportSize({width,height:900});await page.setContent(html());
  const badges=page.getByText(meta.label,{exact:true});assert.equal(await badges.count(),3,'List + header + read-only status');
  const colors=await badges.evaluateAll(nodes=>nodes.map(node=>({text:getComputedStyle(node).color,bg:getComputedStyle(node.parentElement).backgroundColor})));
  const rgb=hex=>'rgb('+[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(', ')+')';
  for(const color of colors){assert.equal(color.text,rgb(meta.color));assert.equal(color.bg,rgb(meta.bgColor));}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(width===390)await page.screenshot({path:`report/status-ui/${key}-390.png`,fullPage:true});
 }
 console.log('PASS four statuses: actual list card + both Task Detail badges share text/background colors at 390/1280; picker, Calendar and Timeline mappings match; no horizontal overflow. SSR uses child-component/context adapters; native navigation not exercised.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
