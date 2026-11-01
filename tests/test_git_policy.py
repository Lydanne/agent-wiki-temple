import unittest,tempfile,json,subprocess,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class GitPolicy(unittest.TestCase):
 def test_supported_modes_and_invalid_mode(self):
  with tempfile.TemporaryDirectory() as td:
   r=Path(td)/'repo';shutil.copytree(ROOT,r,ignore=shutil.ignore_patterns('.git','__pycache__'))
   p=r/('project.json' if (r/'project.json').exists() else 'git-policy.json');d=json.loads(p.read_text());g=d['git'] if p.name=='project.json' else d
   for mode in ['read-only','local','direct','review','invalid']:
    g['delivery']=mode;p.write_text(json.dumps(d))
    code=subprocess.run(['python3',str(r/'scripts/check.py'),str(r)],capture_output=True).returncode
    self.assertEqual(code==0,mode!='invalid')
 def test_readonly_preflight_reports_dirty_without_mutating(self):
  with tempfile.TemporaryDirectory() as td:
   r=Path(td);subprocess.run(['git','init','-b','main',str(r)],check=True,capture_output=True)
   (r/'git-policy.json').write_text(json.dumps({'delivery':'local','auto_merge':False}))
   before=subprocess.check_output(['git','-C',str(r),'status','--porcelain'])
   result=subprocess.run(['python3',str(ROOT/'scripts/git-check.py')],cwd=r,capture_output=True,text=True,check=True)
   j=json.loads(result.stdout);self.assertTrue(j['dirty']);self.assertEqual(j['remote_checks'],'not_run');self.assertEqual(j['mode'],'local')
   self.assertEqual(before,subprocess.check_output(['git','-C',str(r),'status','--porcelain']))
