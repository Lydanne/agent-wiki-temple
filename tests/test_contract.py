import unittest,tempfile,shutil,subprocess,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class Contract(unittest.TestCase):
 def test_clean_template(self):
  self.assertEqual(subprocess.run(['python3',str(ROOT/'scripts/check.py'),str(ROOT)],capture_output=True).returncode,0)
 def test_reject_invalid_metadata_or_policy(self):
  with tempfile.TemporaryDirectory() as td:
   r=Path(td)/'repo';shutil.copytree(ROOT,r,ignore=shutil.ignore_patterns('.git','__pycache__'))
   if (r/'bundle.json').exists():
    s=(r/'README.md').read_text();(r/'README.md').write_text(s.replace('"draft"','"stable"',1))
   else:
    p=r/'project.json';d=json.loads(p.read_text());d['git']['auto_merge']=True;p.write_text(json.dumps(d))
   self.assertNotEqual(subprocess.run(['python3',str(ROOT/'scripts/check.py'),str(r)],capture_output=True).returncode,0)

 def test_duplicate_uid_and_broken_link_are_rejected(self):
  for mode in ['duplicate','link']:
   with tempfile.TemporaryDirectory() as td:
    r=Path(td)/'repo';shutil.copytree(ROOT,r,ignore=shutil.ignore_patterns('.git','__pycache__'))
    if mode=='duplicate':shutil.copyfile(r/'README.md',r/'duplicate.md')
    else:
     with (r/'README.md').open('a') as out:out.write('\n[missing](does-not-exist.md)\n')
    self.assertNotEqual(subprocess.run(['python3',str(ROOT/'scripts/check.py'),str(r)],capture_output=True).returncode,0)
