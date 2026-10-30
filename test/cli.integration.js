'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const cli = path.resolve(__dirname, '../bin/cli.js');
let passed = 0;

function scenario(name, fn) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'git-format-test-'));
  const env = { ...process.env, CLI_LITERAL: 'EXPANDED_BY_SHELL', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: path.join(cwd, 'empty.gitconfig') };
  fs.writeFileSync(env.GIT_CONFIG_GLOBAL, '');
  const git = (...args) => execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd, env, encoding: 'utf8' });
  try {
    git('init', '-q');
    git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
    git('config', 'commit.gpgsign', 'false'); git('config', 'core.hooksPath', path.join(cwd, 'no-hooks'));
    git('commit', '--allow-empty', '-qm', 'fixture seed');
    const head = git('rev-parse', 'HEAD');
    const stage = (file = 'src/example.js') => { fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true }); fs.writeFileSync(path.join(cwd, file), 'const value = 1;\n'); git('add', '--', file); return file; };
    fn({ cwd, git, run, head, stage });
    passed++; console.log(`  ✓ ${name}`);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
}

scenario('help never commits staged changes', ({ run, stage, git, head }) => {
  stage(); const r = run('--help'); assert.strictEqual(r.status, 0, r.stderr); assert.match(r.stdout, /Usage:/); assert.strictEqual(git('rev-parse', 'HEAD'), head);
});
scenario('version reports package version', ({ run, git, head }) => {
  const r = run('--version'); assert.strictEqual(r.status, 0); assert.strictEqual(r.stdout.trim(), require('../package.json').version); assert.strictEqual(git('rev-parse', 'HEAD'), head);
});
scenario('dry-run JSON preserves Unicode and spaces without committing', ({ run, stage, git, head }) => {
  const file = stage('src/研究 notes.js'); const r = run('--dry-run', '--json'); assert.strictEqual(r.status, 0, r.stderr); assert.deepStrictEqual(JSON.parse(r.stdout).files, [file]); assert.strictEqual(git('rev-parse', 'HEAD'), head);
});
scenario('empty index produces valid JSON', ({ run }) => {
  const r = run('--json', '--dry-run'); assert.strictEqual(r.status, 0); assert.deepStrictEqual(JSON.parse(r.stdout).files, []);
});
scenario('JSON commit keeps filenames literal and stdout parseable', ({ run, stage, git, head }) => {
  const file = stage('src/%CLI_LITERAL% file.js'); const r = run('--json', 'feat'); assert.strictEqual(r.status, 0, r.stderr); const data = JSON.parse(r.stdout); assert.deepStrictEqual(data.files, [file]); assert.notStrictEqual(git('rev-parse', 'HEAD'), head); assert.strictEqual(git('log', '-1', '--format=%s'), data.message); assert.ok(data.message.includes('%CLI_LITERAL%'));
});
scenario('unknown options never commit', ({ run, stage, git, head }) => {
  stage(); const r = run('--dry-rnu'); assert.notStrictEqual(r.status, 0); assert.strictEqual(git('rev-parse', 'HEAD'), head);
});
scenario('non-repository failure is not an empty successful scan', ({ run, cwd }) => {
  fs.rmSync(path.join(cwd, '.git'), { recursive: true, force: true }); const r = run('--dry-run', '--json'); assert.notStrictEqual(r.status, 0);
});
console.log(`${passed} CLI integration scenarios passed`);
