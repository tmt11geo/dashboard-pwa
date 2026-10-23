"""Compare preserved temporal and three-view reports on identical input sequences."""
import json
from pathlib import Path
ROOT=Path(__file__).parent/'evidence'
rows={}
for profile in ['clean','blur','noise','claimed_wrong_calibration']:
    old=json.loads((ROOT/f'temporal-{profile}.json').read_text())
    new=json.loads((ROOT/f'three-view-{profile}.json').read_text())
    prior={(r['seed'],r['case']):r for r in old['sequences']}
    comparison=[];fresh=[]
    for r in new['sequences']:
        key=(r['seed'],r['case'])
        if key not in prior:
            fresh.append(dict(seed=r['seed'],case=r['case'],kind=r['kind'],passed=r['passed']));continue
        before=prior[key]
        assert [f['imageHash'] for f in before['frames']]==[f['imageHash'] for f in r['frames']],key
        comparison.append(dict(seed=r['seed'],case=r['case'],kind=r['kind'],before=before['passed'],after=r['passed']))
    rows[profile]=dict(sharedSequenceInputsVerified=len(comparison),improvements=[r for r in comparison if not r['before'] and r['after']],regressions=[r for r in comparison if r['before'] and not r['after']],beforePositive=sum(r['before'] for r in comparison if r['kind']=='positive'),afterPositive=sum(r['after'] for r in comparison if r['kind']=='positive'),fresh=fresh)
(ROOT/'three-view-comparison.json').write_text(json.dumps(rows,indent=2)+'\n')
for p,s in rows.items():print(p, {k:v for k,v in s.items() if k not in ('improvements','regressions','fresh')},'regressions',len(s['regressions']))
