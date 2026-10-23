"""Reproducible target verification; separate from tracking-sequence accuracy."""
import json,hashlib
from pathlib import Path
from fixtures import K
from temporal import Calibration
from calibration_fixtures import observations
from calibration_evidence import VerifiedCalibration
p=Path(__file__).parent;spec=json.loads((p/'recovery_spec.json').read_text());rows=[]
for seed in [42]+spec['held_out_seeds']:
    for profile in ['correct','wrong_plus','wrong_minus']:
        k=K.copy()
        if profile=='wrong_plus':k[0,0]*=1.15;k[1,1]*=1.15;k[0,2]+=8;k[1,2]-=6
        if profile=='wrong_minus':k[0,0]*=.9;k[1,1]*=.9;k[0,2]-=6;k[1,2]+=5
        obj,uv=observations(97531+seed)
        row=dict(seed=seed,profile=profile,evidenceHash=hashlib.sha256(b''.join(x.tobytes() for pair in zip(obj,uv) for x in pair)).hexdigest())
        try:
            v=VerifiedCalibration(Calibration('fixture',640,480,k,'synthetic',0),obj,uv)
            row.update(accepted=True,folds=v.diagnostics)
        except ValueError as e:row.update(accepted=False,reason=str(e))
        rows.append(row)
result=dict(policy='Correct calibration must pass; independent target evidence must reject deliberately incorrect intrinsics.',cases=rows,passed=all(r['accepted']==(r['profile']=='correct') for r in rows))
(p/'evidence/recovery-calibration-audit.json').write_text(json.dumps(result,indent=2)+'\n')
print(dict(cases=len(rows),passed=result['passed']))
raise SystemExit(0 if result['passed'] else 1)
