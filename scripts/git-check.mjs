#!/usr/bin/env node
// Read-only preflight: no fetch, switch, commit, push, or authorization decisions.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = realpathSync(process.cwd());
function git(...args) {
  const r = spawnSync('git', ['-c', 'core.fsmonitor=false', ...args], { encoding: 'utf8', timeout: 10000, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' } });
  return r.status === 0 ? r.stdout.trim() : null;
}
try {
  const top = git('rev-parse', '--show-toplevel');
  if (!top || realpathSync(top) !== root) throw Error('Run at the intended Git repository root');
  const project = existsSync(join(root, 'project.json'));
  const config = join(root, project ? 'project.json' : 'git-policy.json');
  const data = existsSync(config) ? JSON.parse(readFileSync(config, 'utf8')) : {};
  const policy = project ? data.git ?? {} : data, mode = policy.delivery ?? 'unspecified';
  if (!['read-only', 'local', 'direct', 'review', 'unspecified'].includes(mode) || (policy.auto_merge ?? false) !== false) throw Error('Invalid Git delivery policy');
  const status = git('status', '--porcelain=v1', '--untracked-files=all');
  if (status === null) throw Error('Git status failed; cleanliness is unknown');
  const upstream = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}');
  const gd = git('rev-parse', '--absolute-git-dir');
  if (!gd) throw Error('Git operation state is unknown');
  console.log(JSON.stringify({ mode, branch: git('branch', '--show-current') || null, head: git('rev-parse', 'HEAD'), upstream, dirty: Boolean(status), git_operation: ['MERGE_HEAD','CHERRY_PICK_HEAD','REVERT_HEAD','rebase-merge','rebase-apply','sequencer'].some(n => existsSync(join(gd, n))), divergence_local_refs: upstream ? git('rev-list', '--left-right', '--count', 'HEAD...@{upstream}') : null, remote_checks: 'not_run', authorization: 'not_evaluated' }, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
