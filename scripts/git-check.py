#!/usr/bin/env python3
"""Read-only repository preflight. Does not fetch, switch, commit, or push."""
import json,subprocess,sys
from pathlib import Path
root=Path.cwd().resolve()
def git(*args):
 p=subprocess.run(['git','-c','core.fsmonitor=false',*args],capture_output=True,text=True,timeout=10)
 return p.stdout.strip() if p.returncode==0 else None
try:
 top=git('rev-parse','--show-toplevel')
 if top is None or Path(top).resolve()!=root:raise ValueError('Run at the intended Git repository root')
 config=root/'project.json' if (root/'project.json').exists() else root/'git-policy.json'
 policy=json.loads(config.read_text()) if config.exists() else {}
 if config.name=='project.json':policy=policy.get('git',{})
 mode=policy.get('delivery','unspecified')
 if mode not in ['read-only','local','direct','review','unspecified'] or policy.get('auto_merge',False) is not False:raise ValueError('Invalid Git delivery policy')
 status=git('status','--porcelain=v1','--untracked-files=all')
 if status is None:raise ValueError('Git status failed; cleanliness is unknown')
 upstream=git('rev-parse','--abbrev-ref','--symbolic-full-name','@{upstream}')
 divergence=git('rev-list','--left-right','--count','HEAD...@{upstream}') if upstream else None
 gd=git('rev-parse','--absolute-git-dir');operation=any((Path(gd)/n).exists() for n in ['MERGE_HEAD','CHERRY_PICK_HEAD','REVERT_HEAD','rebase-merge','rebase-apply','sequencer'])
 result={'mode':mode,'branch':git('branch','--show-current') or None,'head':git('rev-parse','HEAD'),'upstream':upstream,'dirty':bool(status),'git_operation':operation,'divergence_local_refs':divergence,'remote_checks':'not_run','authorization':'not_evaluated'}
 print(json.dumps(result,ensure_ascii=False,indent=2))
except Exception as e:
 print(str(e),file=sys.stderr);sys.exit(1)
