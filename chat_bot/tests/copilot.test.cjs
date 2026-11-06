const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('project/chat_bot mirrors project directory structure', () => {
  const root = path.resolve(__dirname, '..');
  const expectedFiles = [
    'index.js',
    'store/aiCopilotStore.js',
    'src/config/aiPrompts.config.js',
    'src/services/aiService.js',
    'src/screens/aiCopilotScreen.js',
    'src/components/aiActionCard.js',
    'src/components/aiTaskBreakdownPanel.js',
    'src/styles/aiCopilot.styles.js',
    'src/utils/markdownText.helper.js'
  ];

  for (const relPath of expectedFiles) {
    assert.equal(
      fs.existsSync(path.join(root, relPath)),
      true,
      `Missing expected file: ${relPath}`
    );
  }
});

