#!/usr/bin/env node
// Portable template checks. Uses only Node.js built-ins and performs no network requests.
import { existsSync, readFileSync, readdirSync, statSync, realpathSync } from 'node:fs';
import { resolve, relative, dirname, join, isAbsolute, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const inside = (root, path) => { const rel = relative(root, path); return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`)); };
export function validate(directory) {
  const root = realpathSync(directory), errors = [], uids = new Set(), docs = [];
  const require = (ok, message) => { if (!ok) errors.push(message); };
  function local(path, base, file = false) {
    try { const actual = realpathSync(path); return inside(base, actual) && (!file || statSync(actual).isFile()); } catch { return false; }
  }
  function walk(path, excluded) {
    const files = [];
    for (const item of readdirSync(path, { withFileTypes: true })) {
      if (excluded.has(item.name)) continue;
      const next = join(path, item.name);
      if (item.isSymbolicLink()) { require(false, `${next}: symlink in knowledge scope`); continue; }
      if (item.isDirectory()) files.push(...walk(next, excluded));
      else if (item.isFile() && item.name.endsWith('.md')) files.push(next);
    }
    return files;
  }
  const bundle = join(root, 'bundle.json');
  if (existsSync(bundle)) {
    const b = json(bundle);
    require(b.schema_version === 1, 'bundle schema');
    require(typeof b.bundle_id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(b.bundle_id), 'bundle_id');
    const excluded = new Set([...(b.exclude_directories ?? []), '.git', '.tmp', 'node_modules']);
    for (const path of walk(root, excluded)) {
      const text = readFileSync(path, 'utf8'), match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
      let d;
      try { d = match ? JSON.parse(match[1]) : {}; } catch { errors.push(`${path}: invalid JSON-compatible YAML metadata`); continue; }
      const x = d.x_agent ?? {};
      for (const key of ['type', 'title', 'description', 'status']) require(Boolean(d[key]), `${path}: missing ${key}`);
      require(typeof x.uid === 'string' && x.uid.length > 0, `${path}: uid`);
      require(!uids.has(x.uid), `${path}: duplicate uid`); uids.add(x.uid);
      require(['draft', 'stable', 'deprecated'].includes(d.status), `${path}: status`);
      const date = value => typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
      require(date(x.created_at) && date(x.updated_at) && Date.parse(x.updated_at) >= Date.parse(x.created_at), `${path}: timestamps`);
      require(Array.isArray(x.relations), `${path}: relations`);
      require(Array.isArray(d.sources), `${path}: sources`);
      if (d.status === 'stable') require(Array.isArray(d.verified) && d.verified.length > 0 && d.verified.every(v => v?.by && v?.at), `${path}: stable requires real review metadata`);
      const parts = relative(root, path).split(sep);
      if (parts[0] === 'features' && parts.length > 2) require(x.feature_id === parts[1], `${path}: feature_id`);
      docs.push([path, d]);
      const body = (match ? text.slice(match[0].length) : text).replace(/```[\s\S]*?```/g, '');
      for (const [, target] of body.matchAll(/\]\(([^)]+)\)/g)) {
        if (target.includes('://') || target.startsWith('#')) continue;
        require(local(resolve(dirname(path), target.split('#')[0]), root), `${path}: broken or escaping link ${target}`);
      }
    }
    for (const [path, d] of docs) {
      for (const rel of Array.isArray(d.x_agent?.relations) ? d.x_agent.relations : []) {
        require(['references', 'part_of', 'depends_on', 'constrained_by', 'implements', 'supersedes'].includes(rel?.type), `${path}: relation type`);
        if (!rel?.target_bundle) require(uids.has(rel?.target_uid), `${path}: missing relation target`);
      }
      for (const source of Array.isArray(d.sources) ? d.sources : []) {
        require(source?.id && source?.title && source?.resource, `${path}: source fields`);
        require(typeof source?.resource === 'string' && local(resolve(dirname(path), source.resource.split('#')[0]), join(root, 'sources'), true), `${path}: source package`);
      }
    }
  }
  const projectFile = join(root, 'project.json');
  if (existsSync(projectFile)) {
    const c = json(projectFile);
    require(c.schema_version === 1, 'project schema');
    require(c.knowledge?.path === 'wiki', 'default wiki path');
    for (const item of c.repositories ?? []) {
      const path = item?.path;
      require(typeof path === 'string' && path.startsWith('repositories/') && !isAbsolute(path) && !path.split(/[\\/]/).includes('..'), 'repository path');
    }
    if (existsSync(join(root, 'wiki/bundle.json'))) errors.push(...validate(join(root, 'wiki')).map(e => `wiki seed: ${e}`));
  }
  const policyFile = existsSync(projectFile) ? projectFile : join(root, 'git-policy.json');
  if (existsSync(policyFile)) {
    const data = json(policyFile), policy = existsSync(projectFile) ? data.git ?? {} : data;
    require(['read-only', 'local', 'direct', 'review'].includes(policy.delivery), 'git delivery mode');
    require(policy.auto_merge === false, 'auto merge must remain disabled');
    require(policy.sync === 'ff-only', 'sync policy');
    require(typeof policy.branch_prefix === 'string' && policy.branch_prefix.length > 0, 'branch prefix');
  }
  const skills = join(root, '.agents/skills');
  if (existsSync(skills)) for (const item of readdirSync(skills, { withFileTypes: true })) {
    const path = join(skills, item.name, 'SKILL.md');
    if (item.isDirectory() && existsSync(path)) require(/^---\r?\nname: [a-z0-9-]+\r?\ndescription: .+\r?\n---/.test(readFileSync(path, 'utf8')), `${path}: skill discovery metadata`);
  }
  return errors;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const errors = validate(process.argv[2] ?? '.');
    console.log(errors.length ? errors.join('\n') : 'PASS: metadata, IDs, relations, local links, project policy and skills');
    process.exitCode = errors.length ? 1 : 0;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
