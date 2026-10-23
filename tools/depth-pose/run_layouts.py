"""Additional unseen geometry, using the frozen candidate; no tuning."""
import hashlib,json
from pathlib import Path
import cv2
import numpy as np
import prototype as candidate
import baseline_b8b1ff4 as baseline
from fixtures import K,scene,render,cases
cv2.setNumThreads(1)
root=Path(__file__).parent;rows=[]
for seed in [57291,90210]:
    rng=np.random.default_rng(seed);planes=scene(seed)
    # Change depth, centre and surface extent, then paint far-to-near.
    for i,(corners,texture) in enumerate(planes):
        corners[:,2]*=rng.uniform(.8,1.2)
        if i:
            centre=corners[:,:2].mean(axis=0)
            corners[:,:2]=(corners[:,:2]-centre)*rng.uniform(.7,1.2)+centre+rng.uniform(-.18,.18,2)
    planes.sort(key=lambda p:-p[0][:,2].mean())
    first=render(planes)
    for name,R,center,expected in cases():
        second=render(planes,R,center)
        for width in [640,224]:
            s=width/640;a=cv2.resize(first,(width,round(480*s)),interpolation=cv2.INTER_AREA);b=cv2.resize(second,(width,round(480*s)),interpolation=cv2.INTER_AREA)
            k=K.copy();k[:2]*=s;k[0,2]=(K[0,2]+.5)*s-.5;k[1,2]=(K[1,2]+.5)*s-.5
            results={}
            for label,module in [('baseline',baseline),('candidate',candidate)]:
                got=module.estimate(a,b,k)
                re=candidate.rotation_error(np.array(got['R']),R) if got['R'] is not None else None
                te=candidate.angle(np.array(got['t']),-R@center) if got['t'] is not None and expected=='pose' else None
                passed=(got['t'] is None and re is not None and re<2) if expected=='no_translation' else (te is not None and te<10 and re<2)
                results[label]=dict(passed=passed,rotationError=re,directionError=te,status=got['status'],reason=got['reason'],translationOutput=got['t'] is not None)
            rows.append(dict(seed=seed,name=name,width=width,expected=expected,imageHashes=[hashlib.sha256(x.tobytes()).hexdigest() for x in [a,b]],results=results))
summary={}
for w in [640,224]:
    summary[str(w)]={}
    for label in ['baseline','candidate']:
        pos=[r for r in rows if r['width']==w and r['expected']=='pose'];neg=[r for r in rows if r['width']==w and r['expected']!='pose']
        summary[str(w)][label]=dict(posePassed=sum(r['results'][label]['passed'] for r in pos),poseTotal=len(pos),negativePassed=sum(r['results'][label]['passed'] for r in neg),negativeTotal=len(neg),falseTranslations=sum(r['results'][label]['translationOutput'] for r in neg),inaccurateAcceptedPoses=sum(r['results'][label]['translationOutput'] and not r['results'][label]['passed'] for r in pos))
report=dict(scope='Two unseen geometric layouts; candidate unchanged after prior holdout',sourceSha256={p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in ['prototype.py','baseline_b8b1ff4.py','fixtures.py','run_layouts.py']},summary=summary,cases=rows)
(root/'evidence/layouts.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(summary),flush=True)
raise SystemExit(0 if all(r['results']['candidate']['passed'] for r in rows) else 1)
