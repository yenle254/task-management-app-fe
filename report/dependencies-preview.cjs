const fs=require('fs'),babel=require('@babel/core'),React=require('react'),RN=require('react-native-web'),assert=require('assert/strict');
const {renderToStaticMarkup}=require('react-dom/server');const {chromium}=require('../../server/node_modules/playwright');
function load(file,deps={}){const m={exports:{}};const code=babel.transformSync(fs.readFileSync(file,'utf8'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-modules-commonjs','@babel/plugin-transform-react-jsx']}).code;new Function('require','module','exports',code)(n=>n in deps?deps[n]:()=>null,m,m.exports);return m.exports;}
const Colors=load('src/styles/color.js').default,statuses=load('src/utils/taskStatusMap.js');const svg=tag=>({accessible,...props})=>React.createElement(tag,props);
const deps={react:React,'react-native':RN,'react-native-svg':{__esModule:true,default:svg('svg'),Path:svg('path'),Circle:svg('circle')},'../../styles/color':Colors,'../../utils/taskStatusMap':statuses};
const picker=load('src/components/task/taskPickerModal.js',deps);
const Card=load('src/components/task/taskDependenciesCard.js',{...deps,'./taskPickerModal':picker}).default;
const tasks=[{_id:'abc001',title:'Implement API Logic',status:'in_progress'},{_id:'abc002',title:'Design Database Schema',status:'in_review'},{_id:'abc003',title:'Setup CI/CD Pipeline',status:'todo'},{_id:'abc004',title:'Review requirements',status:'done'}];
function html(mode){const list=mode==='empty'?[]:tasks.map(t=>({...t,title:mode==='long'?t.title+' with a longer title that must remain readable':t.title}));
 const App=()=>React.createElement(RN.View,{style:{paddingVertical:12,backgroundColor:Colors.white}},React.createElement(Card,{dependencies:{blockedBy:list,blocking:list.filter(t=>t.status!=='done')},dependencyIds:mode==='unavailable'?[...list.map(t=>t._id),'abc099']:list.map(t=>t._id),loading:mode==='loading',error:mode==='error'?'Failed':'',disabled:mode==='locked',onOpenTask(){},onRemove(){},onAdd(){},onRetry(){}}));
 RN.AppRegistry.registerComponent('DependenciesPreview',()=>App);const {element,getStyleElement}=RN.AppRegistry.getApplication('DependenciesPreview');const markup=renderToStaticMarkup(element);return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+renderToStaticMarkup(getStyleElement())+'</head><body style="margin:0">'+markup+'</body></html>';}
(async()=>{fs.mkdirSync('report/dependencies-ui',{recursive:true});const browser=await chromium.launch({headless:true});try{const page=await browser.newPage();
 for(const width of [320,390,1280])for(const mode of ['default','empty','long','unavailable','locked','error','loading']){
  await page.setViewportSize({width,height:700});await page.setContent(html(mode));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(mode==='default'){for(const meta of Object.values(statuses.taskStatusMap)){const badge=page.getByText(meta.label,{exact:true});const color=await badge.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el.parentElement).backgroundColor}));const rgb=hex=>'rgb('+[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(', ')+')';assert.equal(color.text,rgb(meta.color));assert.equal(color.bg,rgb(meta.bgColor));}assert.equal(await page.getByRole('button',{name:/Open dependency:/}).count(),4);}
  if(mode==='unavailable'){assert.equal(await page.getByText('Unavailable dependency',{exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'Remove dependency: #T-C099',exact:true}).count(),1);}
  if(mode==='locked'){for(const b of await page.getByRole('button',{name:/Remove dependency:|Add dependency/}).all())assert.equal(await b.getAttribute('aria-disabled'),'true');}
  if(mode==='error'||mode==='loading')assert.equal(await page.getByText('Unavailable dependency',{exact:true}).count(),0);
  if(width===390||mode==='long')await page.screenshot({path:`report/dependencies-ui/${mode}-${width}.png`,fullPage:true});
 }
 console.log('PASS Dependencies: four shared status colors, separate open/remove actions, unavailable and disabled states, no horizontal overflow at 320/390/1280. RN Web SSR preview; no native/API interaction certification.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
