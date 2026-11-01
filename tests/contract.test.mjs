import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync, appendFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
const run = (args, cwd = root) => spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });
function fixture(t) {
  const temp = mkdtempSync(join(tmpdir(), 'agent-template-test-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const repo = join(temp, 'repo');
  cpSync(root, repo, { recursive: true, filter: p => !['.git', 'node_modules', '__pycache__'].includes(p.split(/[\\/]/).at(-1)) });
  return repo;
}
const check = repo => run([join(root, 'scripts/check.mjs'), repo]);
function policy(repo) {
  const file = join(repo, existsSync(join(repo, 'project.json')) ? 'project.json' : 'git-policy.json');
  const data = JSON.parse(readFileSync(file));
  return { git: file.endsWith('project.json') ? data.git : data, save: () => writeFileSync(file, JSON.stringify(data)) };
}
test('template passes without installing dependencies', () => assert.equal(check(root).status, 0, check(root).stdout));
for (const mode of ['read-only', 'local', 'direct', 'review', 'invalid']) test(`Git mode: ${mode}`, t => {
  const repo = fixture(t), p = policy(repo); p.git.delivery = mode; p.save();
  assert.equal(check(repo).status === 0, mode !== 'invalid');
});
test('auto merge cannot be silently enabled', t => {
  const repo = fixture(t), p = policy(repo); p.git.auto_merge = true; p.save();
  assert.notEqual(check(repo).status, 0);
});
const wikiRoot = repo => existsSync(join(repo, 'bundle.json')) ? repo : join(repo, 'wiki');
for (const kind of ['missing-metadata', 'duplicate-uid', 'broken-link', 'unreviewed-stable', 'unknown-relation', 'invalid-time', 'invalid-calendar']) test(`knowledge rejection: ${kind}`, t => {
  const repo = fixture(t), wiki = wikiRoot(repo), file = join(wiki, 'README.md');
  const text = readFileSync(file, 'utf8');
  if (kind === 'missing-metadata') writeFileSync(file, '# No metadata');
  if (kind === 'duplicate-uid') cpSync(file, join(wiki, 'duplicate.md'));
  if (kind === 'broken-link') appendFileSync(file, '\n[missing](not-found.md)\n');
  if (kind === 'unreviewed-stable') writeFileSync(file, text.replace('"draft"', '"stable"'));
  if (kind === 'unknown-relation') writeFileSync(file, text.replace('"relations": []', '"relations": [{"type":"references","target_uid":"missing"}]'));
  if (kind === 'invalid-calendar') writeFileSync(file, text.replace(/\"updated_at\": \"[^\"]+\"/, '\"updated_at\":\"2026-02-30T12:00:00+08:00\"'));
  if (kind === 'invalid-time') writeFileSync(file, text.replace(/"updated_at": "[^"]+"/, '"updated_at":"unknown"'));
  assert.notEqual(check(repo).status, 0);
});
test('escaping project repository path is rejected', t => {
  const repo = fixture(t), file = join(repo, 'project.json');
  if (!existsSync(file)) { t.skip('project-only constraint'); return; }
  const data = JSON.parse(readFileSync(file)); data.repositories = [{ path: 'repositories/../../outside' }];
  writeFileSync(file, JSON.stringify(data)); assert.notEqual(check(repo).status, 0);
});
test('symlink outside knowledge scope is rejected', t => {
  const repo = fixture(t), wiki = wikiRoot(repo);
  const outside = join(repo, '..', 'outside.md'); writeFileSync(outside, 'private');
  symlinkSync(outside, join(wiki, 'outside.md')); assert.notEqual(check(repo).status, 0);
});
test('preflight preserves dirty repository state and reports local scope only', t => {
  const temp = mkdtempSync(join(tmpdir(), 'git-preflight-')); t.after(() => rmSync(temp, { recursive: true, force: true }));
  const git = (...args) => spawnSync('git', ['-C', temp, ...args], { encoding: 'utf8' });
  assert.equal(git('init', '-b', 'main').status, 0);
  writeFileSync(join(temp, 'git-policy.json'), JSON.stringify({ delivery: 'local', auto_merge: false }));
  const before = git('status', '--porcelain').stdout;
  const result = run([join(root, 'scripts/git-check.mjs')], temp);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout); assert.equal(data.mode, 'local'); assert.equal(data.dirty, true);
  assert.equal(data.remote_checks, 'not_run'); assert.equal(data.authorization, 'not_evaluated');
  assert.equal(git('status', '--porcelain').stdout, before);
});
test('preflight rejects a non-repository directory', t => {
  const temp = mkdtempSync(join(tmpdir(), 'not-a-repo-')); t.after(() => rmSync(temp, { recursive: true, force: true }));
  assert.notEqual(run([join(root, 'scripts/git-check.mjs')], temp).status, 0);
});
