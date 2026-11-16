const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const React = require('react');

const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

function loadModule(relPath, mocks = {}) {
  const filename = path.resolve(PROJECT_ROOT, relPath);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename,
    configFile: false,
    babelrc: false,
    plugins: ['@babel/plugin-transform-modules-commonjs', '@babel/plugin-transform-react-jsx'],
  }).code;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)((name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.endsWith('.svg')) return name;
    return require(name);
  }, mod, mod.exports);
  return mod.exports;
}

function collectNodes(node, acc = []) {
  if (Array.isArray(node)) node.forEach((child) => collectNodes(child, acc));
  else if (node && typeof node === 'object' && node.props) {
    acc.push(node);
    collectNodes(node.props.children, acc);
  }
  return acc;
}

function createTaskScreenHarness({
  role,
  teamId = { _id: 'team-populated-id', name: 'QA Team' },
  initialTitle = 'Valid Task Title',
  initialMembers = [{ _id: 'emp-1', profile: { fullName: 'Employee 1' } }],
  selectedTeam = { _id: 'team-hr-id', name: 'HR Selected Team' },
  createTaskImpl = async (payload) => ({ data: { _id: 'new-task-1', ...payload } }),
}) {
  const alerts = [];
  const effects = [];
  const goBackCalls = [];
  const teamMemberCalls = [];
  const getAllTeamsCalls = [];
  const createTaskCalls = [];
  const stateValues = [
    { tags: [], estimatedMinutes: '', storyPoints: '', checklistTitle: '' },
    'medium',
    [],
    initialTitle,
    'Task description',
    initialMembers,
    { id: 'medium', name: 'Medium' },
    [],
    new Date('2026-11-20T00:00:00.000Z'),
    new Date('2026-11-22T00:00:00.000Z'),
    [],
    false,
    new Date('2026-11-20T00:00:00.000Z'),
    null,
    '',
    false,
    false,
    false,
    false,
    false,
    [],
    null,
    [],
    false,
    [],
    selectedTeam,
    false,
    null,
  ];
  let stateCursor = 0;

  const rn = Object.fromEntries(
    ['ActivityIndicator', 'KeyboardAvoidingView', 'Modal', 'Pressable', 'ScrollView', 'Text', 'TextInput', 'TouchableOpacity', 'View'].map(
      (k) => [k, k]
    )
  );
  const CreateTaskScreen = loadModule('src/screens/task/createTaskScreen.js', {
    react: {
      ...React,
      useState: (initial) => {
        const idx = stateCursor++;
        const val = idx < stateValues.length ? stateValues[idx] : (typeof initial === 'function' ? initial() : initial);
        return [val, () => {}];
      },
      useEffect: (fn) => effects.push(fn),
    },
    'react-native': {
      ...rn,
      Alert: { alert: (...args) => alerts.push(args) },
      Platform: { OS: 'android' },
      StyleSheet: { create: (s) => s },
    },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '@/src/contexts/authContext': {
      useAuth: () => ({
        user: { _id: 'actor-1', role, teamId },
        canManageTasks: () => role === 'team_lead' || role === 'hr_manager',
      }),
    },
    '../../services/tokenManager': { getValidAccessToken: async () => 'tok', authorizedFetch: async () => ({}) },
    'expo-document-picker': { getDocumentAsync: async () => ({ canceled: true }) },
    '../../../store/index': {
      useTaskStore: () => ({
        createTask: async (payload) => {
          createTaskCalls.push(payload);
          return createTaskImpl(payload);
        },
        isLoading: false,
      }),
    },
    '../../components/appButton': 'AppButton',
    '../../components/headerWithBackButton': 'HeaderWithBackButton',
    '../../components/task/subtaskList': 'SubTaskList',
    '../../components/task/addSubtaskInput': 'AddSubtaskInput',
    '../../components/task/subtaskProgress': 'SubtaskProgress',
    '../../components/task/advancedTaskFields': {
      __esModule: true,
      default: 'AdvancedTaskFields',
      emptyAdvancedFields: () => ({ tags: [], estimatedMinutes: '', storyPoints: '', checklistTitle: '' }),
      advancedPayload: (f) => ({ tags: f.tags, estimatedMinutes: null, storyPoints: null }),
    },
    '../../../chat_bot': { AITaskBreakdownPanel: 'AITaskBreakdownPanel' },
    '../../services/taskService': { addChecklist: async () => ({}), addChecklistItem: async () => ({}) },
    '../../services/api': { post: async () => ({}) },
    '../../services/index': {
      teamService: {
        getAllTeams: async (p) => {
          getAllTeamsCalls.push(p);
          return { data: [] };
        },
        getTeamMembers: async (id) => {
          teamMemberCalls.push(id);
          return { data: [] };
        },
      },
    },
    '../../config/runtime-api.config': { API_URL: 'https://api.example.test/api' },
    '../../styles/color': { primary: '#7057FC', white: '#fff', black: '#000', secondary: '#f0f1f7' },
    '@expo/vector-icons': { MaterialCommunityIcons: 'MaterialCommunityIcons' },
  }).default;

  const tree = CreateTaskScreen({ navigation: { goBack: () => goBackCalls.push(true) }, route: {} });
  return { tree, alerts, effects, goBackCalls, teamMemberCalls, getAllTeamsCalls, createTaskCalls };
}

test('CreateTaskScreen denies employee access and navigates back', () => {
  const res = createTaskScreenHarness({ role: 'employee' });
  res.effects[0]();
  assert.equal(res.alerts.length, 1);
  assert.equal(res.alerts[0][0], 'Permission Denied');
  res.alerts[0][2][0].onPress();
  assert.equal(res.goBackCalls.length, 1);
});

test('CreateTaskScreen normalizes populated user.teamId object to string ID for team_lead', async () => {
  const res = createTaskScreenHarness({
    role: 'team_lead',
    teamId: { _id: 'team-populated-id', name: 'QA Team' },
  });
  await res.effects[2]();
  assert.deepEqual(res.teamMemberCalls, ['team-populated-id']);

  const confirmModal = collectNodes(res.tree).find(
    (n) => n.type === 'TouchableOpacity' && collectNodes(n.props.children).some((c) => c.props?.children === 'Yes, Proceed Now')
  );
  assert.ok(confirmModal);
  await confirmModal.props.onPress();
  assert.equal(res.createTaskCalls.length, 1);
  assert.equal(res.createTaskCalls[0].teamId, 'team-populated-id');
});

test('CreateTaskScreen validates minimum 3-character title before calling backend', () => {
  const res = createTaskScreenHarness({ role: 'team_lead', initialTitle: 'ab' });
  const createBtn = collectNodes(res.tree).find((n) => n.type === 'AppButton' && n.props.text === 'Create Task');
  assert.ok(createBtn);
  createBtn.props.onPress();
  assert.deepEqual(res.alerts[0], ['Validation Error', 'Title must be between 3 and 255 characters']);
});

test('CreateTaskScreen surfaces detailed backend field errors instead of generic Validation failed', async () => {
  const res = createTaskScreenHarness({
    role: 'hr_manager',
    createTaskImpl: async () => {
      throw {
        error: 'Validation failed',
        errors: [
          { field: 'title', message: 'Title must be between 3 and 255 characters' },
          { field: 'dueDate', message: 'Due date must be after or equal to start date' },
        ],
      };
    },
  });
  await res.effects[1]();
  assert.equal(res.getAllTeamsCalls.length, 1);

  const confirmModal = collectNodes(res.tree).find(
    (n) => n.type === 'TouchableOpacity' && collectNodes(n.props.children).some((c) => c.props?.children === 'Yes, Proceed Now')
  );
  await confirmModal.props.onPress();
  assert.deepEqual(res.alerts[0], [
    'Error',
    'Title must be between 3 and 255 characters\nDue date must be after or equal to start date',
  ]);
});

