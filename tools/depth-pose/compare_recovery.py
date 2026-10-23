"""Compare trackers only on identical correctly calibrated RGB inputs."""
import json
from pathlib import Path
p=Path(__file__).parent/'evidence';rows={}
for profile in ['clean','blur','noise']:
    old=json.loads((p/f'three-view-{profile}.json').read_text())
    new=json.loads((p/f'recovery-{profile}.json').read_text())
    lookup={(r['seed'],r['case']):r for r in new['sequences']};comp=[]
    for r in old['sequences']:
        n=lookup[r['seed'],r['case']]
        assert [f['imageHash'] for f in r['frames']]==[f['imageHash'] for f in n['frames']]
        comp.append(dict(seed=r['seed'],case=r['case'],kind=r['kind'],before=r['passed'],after=n['passed']))
    rows[profile]=dict(inputsVerified=len(comp),beforePositive=sum(r['before'] for r in comp if r['kind']=='positive'),afterPositive=sum(r['after'] for r in comp if r['kind']=='positive'),improvements=[r for r in comp if not r['before'] and r['after']],regressions=[r for r in comp if r['before'] and not r['after']])
report=dict(note='Wrong-calibration cases are now rejected before tracking, not counted as improved recovery. Valid-camera comparisons use identical RGB hashes.',profiles=rows)
(p/'recovery-comparison.json').write_text(json.dumps(report,indent=2)+'\n')
for profile,r in rows.items():print(profile,r)
