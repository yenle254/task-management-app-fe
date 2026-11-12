const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const RN = require('react-native-web');
const { chromium } = require('../../server/node_modules/playwright');
const assert = require('assert/strict');
function load(file, deps) {
  const module = { exports: {} };
  const code = babel.transformSync(fs.readFileSync(file, 'utf8'), {configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs', '@babel/plugin-transform-react-jsx']}).code;
  new Function('require', 'module', 'exports', code)(name => name in deps ? deps[name] : require(name), module, module.exports);
  return module.exports;
}
const Colors = load('src/styles/color.js', {}).default;
const statuses = load('src/utils/taskStatusMap.js', Object.fromEntries(['todo','inprogress','done'].map(n => ['../../assets/icons/'+n+'.svg', () => null])));
const svg = tag => ({accessible, ...props}) => React.createElement(tag, props);
const TaskTagsCard = load('src/components/task/taskTagsCard.js', {
  'react-native': RN, 'react-native-svg': {__esModule: true, default: svg('svg'), Circle: svg('circle'), Path: svg('path')},
  '../../styles/color': Colors, '../../utils/taskStatusMap': statuses
}).default;
const cards = load('src/components/task/taskRelationshipCards.js', {
  'react-native': RN, 'react-native-svg': {__esModule: true, default: svg('svg'), Circle: svg('circle'), Path: svg('path')},
  '../../styles/color': Colors, '../../utils/taskStatusMap': statuses, '../../services/taskService': {}, './taskTagsCard': TaskTagsCard
});
const baseTask = {_id: 'sample', parentTaskId: {_id: 'parent', title: 'Project Website Redesign', status: 'in_progress'}};
const childTasks = [{_id:'a',title:'Design Landing Page',status:'done'}, {_id:'b',title:'Implement API',status:'in_progress'}, {_id:'c',title:'Accessibility review',status:'in_review'}];
function html(mode) {
  const empty = mode === 'empty';
  const long = mode === 'long';
  const task = empty ? {_id:'empty'} : baseTask;
  const items = empty ? [] : long ? childTasks.map(c => ({...c,title:c.title+' with a longer task title that must wrap without hiding the status'})) : childTasks;
  const tags = empty ? [] : long ? ['A long tag that should wrap across multiple lines', 'UI/UX', 'Frontend'] : ['Frontend','UI/UX','High Priority'];
  const App = () => React.createElement(RN.View, {style:{paddingVertical:12, backgroundColor: Colors.secondary}},
    React.createElement(cards.TaskHierarchyCard, {task, childTasks: items, disabled: mode === 'locked', error: mode === 'error' ? 'Failed' : '', loading: mode === 'loading', onOpenTask(){}, onSetParent(){}, onRemoveParent(){}, onRetry(){}}),
    React.createElement(cards.TaskTagsCard, {tags, disabled: mode === 'locked', onEdit(){}}));
  RN.AppRegistry.registerComponent('Preview', () => App);
  const {element, getStyleElement} = RN.AppRegistry.getApplication('Preview');
  const markup = renderToStaticMarkup(element);
  const css = renderToStaticMarkup(getStyleElement());
  return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+css+'</head><body style="margin:0">'+markup+'</body></html>';
}
(async () => {
  fs.mkdirSync('report/task-relationship-ui', {recursive:true});
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage();
    for (const width of [320,390,1280]) {
      for(const mode of ['default','long','empty','locked','error']) {
        await page.setViewportSize({width,height:900});
        await page.setContent(html(mode));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width} ${mode} overflow`);
        if(mode === 'default') {
          assert.equal(await page.getByRole('button', {name:/Open child task/}).count(),2);
          assert.equal(await page.getByRole('button', {name:'View all (3)'}).count(),1);
          assert.equal(await page.getByText('Project Website Redesign', {exact:true}).count(),1);
        }
        await page.screenshot({path:`report/task-relationship-ui/${mode}-${width}.png`,fullPage:true});
      }
    }
    console.log('PASS: real React Native Web layout at 320, 390, 1280; normal, long text, empty, locked and error states; no horizontal overflow. SVG DOM adapter; SSR layout preview only.');
  } finally { await browser.close(); }
})().catch(e => {console.error(e); process.exitCode=1;});
