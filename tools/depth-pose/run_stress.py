"""Same rendered inputs, frozen baseline vs candidate. Writes failures, exits 1."""
import hashlib,json,platform
from pathlib import Path
import cv2
import numpy as np
import baseline_b8b1ff4 as baseline
import prototype as candidate
from fixtures import K,scene,render,cases
ROOT=Path(__file__).parent
spec=json.loads((ROOT/'stress_spec.json').read_text())
cv2.setNumThreads(1)
def sha(b): return hashlib.sha256(b).hexdigest()
sources={p:sha((ROOT/p).read_bytes()) for p in ['prototype.py','baseline_b8b1ff4.py','fixtures.py','run_stress.py','stress_spec.json']}
def evaluate(got,R,center,expected,orientation):
    errors={}
    if R is not None and got['R'] is not None: errors['rotationDegrees']=candidate.rotation_error(np.array(got['R']),R)
    if got['t'] is not None and expected=='pose': errors['translationDirectionDegrees']=candidate.angle(np.array(got['t']),-R@center)
    if expected=='pose':
        passed=got['status']=='pose' and errors.get('rotationDegrees',999)<spec['rotation_error_degrees'] and errors.get('translationDirectionDegrees',999)<spec['translation_direction_error_degrees']
    else: passed=got['t'] is None and (not orientation or errors.get('rotationDegrees',999)<spec['rotation_error_degrees'])
    return dict(passed=passed,errors=errors,status=got['status'],reason=got['reason'],translationOutput=got['t'] is not None,R=got['R'],t=got['t'],matches=got.get('matches'),rotationSupport=got.get('rotationSupport'),rotationMedianPx=got.get('rotationMedianPx'))
summary={}
for profile in spec['profiles']:
    rows=[]
    for seed in spec['held_out_seeds']:
        planes=scene(seed);first=render(planes)
        samples=[(name,first,render(planes,R,center),R,center,expected,True) for name,R,center,expected in cases()]
        samples += [('flat',np.full_like(first,100),np.full_like(first,100),None,None,'no_translation',False),('unrelated',first,render(scene(seed+1000)),None,None,'no_translation',False),('planar',render(scene(seed,True)),render(scene(seed,True),center=np.array([.15,0,0])),None,None,'no_translation',False)]
        for idx,(name,first,second,R,center,expected,orientation) in enumerate(samples):
            for width in spec['widths']:
                scale=width/640
                a=cv2.resize(first,(width,round(480*scale)),interpolation=cv2.INTER_AREA);b=cv2.resize(second,(width,round(480*scale)),interpolation=cv2.INTER_AREA)
                k=K.copy();k[:2]*=scale;k[0,2]=(K[0,2]+.5)*scale-.5;k[1,2]=(K[1,2]+.5)*scale-.5
                if profile=='blur':
                    a=cv2.GaussianBlur(a,(0,0),spec['blur_sigma_pixels']);b=cv2.GaussianBlur(b,(0,0),spec['blur_sigma_pixels'])
                if profile=='noise':
                    rng=np.random.default_rng(seed*1000+idx*10+width)
                    a=np.clip(a.astype(float)+rng.normal(0,spec['noise_sigma_intensity'],a.shape),0,255).astype(np.uint8)
                    b=np.clip(b.astype(float)+rng.normal(0,spec['noise_sigma_intensity'],b.shape),0,255).astype(np.uint8)
                if profile=='wrong_calibration':
                    k[0,0]*=spec['focal_multiplier'];k[1,1]*=spec['focal_multiplier']
                    k[:2,2]+=np.array(spec['principal_offset_at_640'])*scale
                results={label:evaluate(module.estimate(a,b,k),R,center,expected,orientation) for label,module in [('baseline',baseline),('candidate',candidate)]}
                rows.append(dict(seed=seed,case=name,width=width,expected=expected,imageHashes=[sha(x.tobytes()) for x in [a,b]],results=results))
    groups={}
    for width in spec['widths']:
        group=[r for r in rows if r['width']==width];groups[str(width)]={}
        for label in ['baseline','candidate']:
            pos=[r for r in group if r['expected']=='pose'];neg=[r for r in group if r['expected']!='pose']
            groups[str(width)][label]=dict(posePassed=sum(r['results'][label]['passed'] for r in pos),poseTotal=len(pos),negativePassed=sum(r['results'][label]['passed'] for r in neg),negativeTotal=len(neg),falseTranslations=sum(r['results'][label]['translationOutput'] for r in neg),inaccurateAcceptedPoses=sum(r['results'][label]['translationOutput'] and not r['results'][label]['passed'] for r in pos))
    (ROOT/f'evidence/stress-{profile}.json').write_text(json.dumps(dict(profile=profile,sourceSha256=sources,summary=groups,cases=rows),indent=2)+'\n')
    summary[profile]=groups
    print(profile,json.dumps(groups),flush=True)
report=dict(versions=dict(python=platform.python_version(),opencv=cv2.__version__,numpy=np.__version__),spec=spec,sourceSha256=sources,summary=summary)
report['promotionPass']=all(g['candidate']['posePassed']==g['candidate']['poseTotal'] and g['candidate']['negativePassed']==g['candidate']['negativeTotal'] for p in summary.values() for g in p.values())
(ROOT/'evidence/stress-summary.json').write_text(json.dumps(report,indent=2)+'\n')
raise SystemExit(0 if report['promotionPass'] else 1)
