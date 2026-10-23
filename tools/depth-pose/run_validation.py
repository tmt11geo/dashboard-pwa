import argparse, hashlib, json, platform, time
from pathlib import Path
import cv2
import numpy as np
from fixtures import K,scene,render,cases
from prototype import estimate,rotation_error,angle
p=argparse.ArgumentParser();p.add_argument('--out',default=str(Path(__file__).parent/'evidence/synthetic.json'));p.add_argument('--images');args=p.parse_args()
cv2.setNumThreads(1)
results=[]
for seed in [42,117,903]:
    planes=scene(seed);first=render(planes)
    for name,R,center,expected in cases():
        second=render(planes,R,center)
        for width in [640,224]:
            scale=width/640
            a=cv2.resize(first,(width,round(480*scale)),interpolation=cv2.INTER_AREA)
            b=cv2.resize(second,(width,round(480*scale)),interpolation=cv2.INTER_AREA)
            calibration=K.copy();calibration[:2]*=scale;calibration[0,2]=(K[0,2]+.5)*scale-.5;calibration[1,2]=(K[1,2]+.5)*scale-.5
            start=time.perf_counter();got=estimate(a,b,calibration);elapsed=(time.perf_counter()-start)*1000
            errors={}
            if got['R'] is not None: errors['rotationDegrees']=rotation_error(np.array(got['R']),R)
            if got['t'] is not None and np.linalg.norm(center)>0: errors['translationDirectionDegrees']=angle(np.array(got['t']),-R@center)
            passed=(got['t'] is None and errors.get('rotationDegrees',999)<2) if expected=='no_translation' else (got['status']=='pose' and errors.get('rotationDegrees',999)<2 and errors.get('translationDirectionDegrees',999)<10)
            results.append(dict(seed=seed,name=name,width=width,expected=expected,passed=passed,errors=errors,estimate=got,ms=elapsed,imageHashes=[hashlib.sha256(x.tobytes()).hexdigest() for x in [a,b]]))
            if args.images and seed==42 and width==640:
                out=Path(args.images);out.mkdir(parents=True,exist_ok=True);cv2.imwrite(str(out/(name+'.png')),b)
    # Negative controls: textureless, unrelated scene and single plane.
    for name,a,b in [('flat',np.full_like(first,100),np.full_like(first,100)),('unrelated',first,render(scene(seed+1000))),('planar',render(scene(seed,True)),render(scene(seed,True),center=np.array([.15,0,0])))]:
        got=estimate(a,b,K);results.append(dict(seed=seed,name=name,width=640,expected='no_translation',passed=got['t'] is None,estimate=got))
summary={}
for width in [640,224]:
    group=[r for r in results if r['width']==width]
    positive=[r for r in group if r['expected']=='pose'];negative=[r for r in group if r['expected']=='no_translation']
    summary[str(width)]={'poseRecoveryPassed':sum(r['passed'] for r in positive),'poseRecoveryTotal':len(positive),'negativeControlsPassed':sum(r['passed'] for r in negative),'negativeControlsTotal':len(negative),'passed':sum(r['passed'] for r in group),'total':len(group),'falseTranslations':sum(r['estimate']['t'] is not None for r in group if r['expected']=='no_translation')}
sources={name:hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest() for name in ['prototype.py','fixtures.py','run_validation.py']}
report=dict(sourceSha256=sources,scope='Offline RGB-only pair pose; no depth or fusion',versions=dict(python=platform.python_version(),opencv=cv2.__version__,numpy=np.__version__),criteria=dict(rotationErrorDegrees=2,translationDirectionErrorDegrees=10,negativeControls='must not output translation'),summary=summary,results=results)
Path(args.out).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(summary))
# Explicitly nonzero when quality gates fail; report is always written.
raise SystemExit(0 if all(r['passed'] for r in results) else 1)
