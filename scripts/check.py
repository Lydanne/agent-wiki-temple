#!/usr/bin/env python3
"""Validate the portable template contract; no network or installation required."""
import json,re,sys,datetime
from pathlib import Path
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
errors=[];uids={};docs=[]
def require(ok,msg):
 if not ok: errors.append(msg)
if (root/'bundle.json').exists():
 b=json.loads((root/'bundle.json').read_text());require(b.get('schema_version')==1,'bundle schema');require(bool(re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',b.get('bundle_id',''))),'bundle_id')
 excluded=set(b.get('exclude_directories',[]))|{'.git','.tmp','node_modules'}
 for p in root.rglob('*.md'):
  if any(x in excluded for x in p.relative_to(root).parts):continue
  s=p.read_text();m=re.match(r'^---\n(.*?)\n---\n',s,re.S)
  try:d=json.loads(m[1]) if m else {};x=d.get('x_agent',{})
  except Exception: errors.append(str(p)+': invalid JSON-compatible YAML metadata');continue
  for k in ['type','title','description','status']:require(bool(d.get(k)),str(p)+': missing '+k)
  uid=x.get('uid');require(isinstance(uid,str) and bool(uid),str(p)+': uid');require(uid not in uids,str(p)+': duplicate uid');uids[uid]=p
  require(d.get('status') in ['draft','stable','deprecated'],str(p)+': status')
  try:
   times=[datetime.datetime.fromisoformat(x[k]) for k in ['created_at','updated_at']];require(all(t.tzinfo for t in times) and times[1]>=times[0],str(p)+': timestamps')
  except Exception:errors.append(str(p)+': timestamps')
  require(isinstance(x.get('relations'),list),str(p)+': relations')
  require(isinstance(d.get('sources'),list),str(p)+': sources')
  if d.get('status')=='stable':require(bool(d.get('verified')) and all(v.get('by') and v.get('at') for v in d.get('verified',[])),str(p)+': stable requires real review metadata')
  parts=p.relative_to(root).parts
  if parts[0]=='features' and len(parts)>2:require(x.get('feature_id')==parts[1],str(p)+': feature_id')
  docs.append((p,d))
  body=re.sub(r'```.*?```','',s[m.end():] if m else s,flags=re.S)
  for target in re.findall(r'\]\(([^)]+)\)',body):
   if '://' in target or target.startswith('#'):continue
   dest=(p.parent/target.split('#')[0]).resolve();require(dest.is_relative_to(root) and dest.exists(),str(p)+': broken or escaping link '+target)
 for p,d in docs:
  for rel in d['x_agent'].get('relations',[]):
   require(rel.get('type') in ['references','part_of','depends_on','constrained_by','implements','supersedes'],str(p)+': relation type')
   if not rel.get('target_bundle'):require(rel.get('target_uid') in uids,str(p)+': missing relation target')
  for source in d.get('sources',[]):
   require(all(source.get(k) for k in ['id','title','resource']),str(p)+': source fields')
   target=(p.parent/source.get('resource','').split('#')[0]).resolve();require(target.is_relative_to(root/'sources') and target.is_file(),str(p)+': source package')
if (root/'project.json').exists():
 c=json.loads((root/'project.json').read_text());require(c.get('schema_version')==1,'project schema');require(c.get('knowledge',{}).get('path')=='wiki','default wiki path')
 for item in c.get('repositories',[]):
  p=Path(item.get('path',''));require(str(p).startswith('repositories/') and not p.is_absolute() and '..' not in p.parts,'repository path')
 require(c.get('git',{}).get('auto_merge') is False,'template must not authorize auto merge')
if (root/'project.json').exists() and (root/'wiki/bundle.json').exists():
 import subprocess
 require(subprocess.run([sys.executable,str(Path(__file__).resolve()),str(root/'wiki')],capture_output=True).returncode==0,'wiki seed metadata')
for p in root.glob('.agents/skills/*/SKILL.md'):
 s=p.read_text();require(bool(re.match(r'^---\nname: [a-z0-9-]+\ndescription: .+\n---',s)),str(p)+': skill discovery metadata')
print('\n'.join(errors) if errors else 'PASS: metadata, IDs, relations, local links, project policy and skills')
sys.exit(bool(errors))
