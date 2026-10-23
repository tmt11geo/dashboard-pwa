"""Sequence validation. Ground truth is used for scoring only, never estimation."""
import argparse,hashlib,json
from pathlib import Path
import cv2
import numpy as np
from fixtures import K,scene,render,rotation
from prototype import rotation_error,angle
from temporal import Calibration
from recovery import RecoveryTracker as KeyframeTracker
from calibration_evidence import VerifiedCalibration
from calibration_fixtures import observations
ROOT=Path(__file__).parent
spec=json.loads((ROOT/'recovery_spec.json').read_text())
parser=argparse.ArgumentParser();parser.add_argument('--development',action='store_true');args=parser.parse_args()
cv2.setNumThreads(1)
def sequences():
    yield 'stationary','negative',lambda i:(np.eye(3),np.zeros(3))
    for axis in range(3):
        for sign in [-1,1]:
            def translation(i,axis=axis,sign=sign):
                c=np.zeros(3);c[axis]=i*sign*(spec['translation_step_z'] if axis==2 else spec['translation_step_xy'])
                return np.eye(3),c
            yield f'translate_{axis}_{sign}','positive',translation
            yield f'rotate_{axis}_{sign}','negative',lambda i,axis=axis,sign=sign:(rotation(axis,i*sign*spec['rotation_step_degrees']),np.zeros(3))
    yield 'combined','positive',lambda i:(rotation(2,i*.2)@rotation(1,-i*.35)@rotation(0,i*.25),i*np.array([.05,-.03,.1]))
    yield 'reversal','positive',lambda i:(np.eye(3),np.array([.08*(i if i<=4 else 8-i),0,0]))
    yield 'curved','positive',lambda i:(rotation(1,-i*.7),np.array([.05*i,.012*i*i,.04*i]))
def score(pose,R,C,Ra,Ca):
    if pose.get('t') is None:return None
    relative=R@Ra.T; t=R@(Ca-C)
    re=rotation_error(np.array(pose['R']),relative)
    if np.linalg.norm(t)<1e-9:return dict(accurate=False,falseTranslation=True,rotationError=re,directionError=None)
    te=angle(np.array(pose['t']),t)
    return dict(accurate=re<spec['rotation_error_degrees'] and te<spec['direction_error_degrees'],falseTranslation=False,rotationError=re,directionError=te)
seeds=[42] if args.development else spec['held_out_seeds']
profiles=['clean'] if args.development else spec['profiles']
sources={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in ['recovery.py','calibration_evidence.py','calibration_fixtures.py','three_view.py','temporal.py','prototype.py','fixtures.py','run_recovery.py','recovery_spec.json']}
total={}
for profile in profiles:
    rows=[]
    for seed in seeds:
        planes=scene(seed);rng=np.random.default_rng(seed)
        # Unseen depth/layout variations, consistent far-to-near rendering.
        if not args.development:
            for i,(corners,tex) in enumerate(planes):
                corners[:,2]*=rng.uniform(.85,1.15)
                if i: corners[:,:2]+=rng.uniform(-.12,.12,2)
        planes.sort(key=lambda p:-p[0][:,2].mean())
        for case_index,(name,kind,motion) in enumerate(sequences()):
            k=K.copy()
            if profile=='claimed_wrong_calibration':
                k[0,0]*=1.15;k[1,1]*=1.15;k[0,2]+=8;k[1,2]-=6
            if profile=='wrong_calibration_minus':
                k[0,0]*=.9;k[1,1]*=.9;k[0,2]-=6;k[1,2]+=5
            try:
                verified=VerifiedCalibration(Calibration('fixture',640,480,k,'synthetic',0),*observations(97531+seed))
                tracker=KeyframeTracker(verified)
            except ValueError as error:
                rows.append(dict(seed=seed,case=name,kind='invalid_calibration' if 'calibration' in profile else kind,passed='calibration' in profile,calibrationRejected=True,reason=str(error),frames=[]))
                continue
            poses=[];frames=[]
            for i in range(spec['frames_per_sequence']):
                R,C=motion(i);poses.append((R,C));image=render(planes,R,C)
                if profile=='blur':image=cv2.GaussianBlur(image,(0,0),spec['blur_sigma'])
                if profile=='noise':
                    noise=np.random.default_rng(seed*1000+case_index*10+i).normal(0,spec['noise_sigma'],image.shape)
                    image=np.clip(image.astype(float)+noise,0,255).astype(np.uint8)
                event=tracker.push(image,i,'fixture')
                Ra,Ca=poses[event['anchor_id']]
                frames.append(dict(index=i,imageHash=hashlib.sha256(image.tobytes()).hexdigest(),status=event['status'],reason=event.get('reason'),anchor=event['anchor_id'],confirmations=event.get('confirmations'),rotationCycleDegrees=event.get('rotationCycleDegrees'),emitted=score(event,R,C,Ra,Ca),rawPair=score(event.get('pair',{}),R,C,Ra,Ca),diagnostics={k:v for k,v in event.items() if k not in ('R','t','pair')}))
            emitted=[f['emitted'] for f in frames if f['emitted']]
            passed=(not emitted) if kind=='negative' else bool(emitted) and all(e['accurate'] for e in emitted)
            rows.append(dict(seed=seed,case=name,kind=kind,passed=passed,frames=frames))
    pos=[r for r in rows if r['kind']=='positive'];neg=[r for r in rows if r['kind']=='negative']
    emitted=[f['emitted'] for r in rows for f in r['frames'] if f['emitted']]
    raw=[f['rawPair'] for r in rows for f in r['frames'] if f['rawPair']]
    summary=dict(calibrationRejected=sum(r.get('calibrationRejected',False) for r in rows),positivePassed=sum(r['passed'] for r in pos),positiveTotal=len(pos),negativePassed=sum(r['passed'] for r in neg),negativeTotal=len(neg),keyframes=len(emitted),inaccurateKeyframes=sum(not e['accurate'] for e in emitted),falseTranslations=sum(e['falseTranslation'] for e in emitted),rawPairs=len(raw),inaccurateRawPairs=sum(not e['accurate'] for e in raw))
    prefix='recovery-development' if args.development else 'recovery'
    (ROOT/f'evidence/{prefix}-{profile}.json').write_text(json.dumps(dict(sourceSha256=sources,summary=summary,sequences=rows),indent=2)+'\n')
    total[profile]=summary;print(profile,json.dumps(summary),flush=True)
report=dict(sourceSha256=sources,spec=spec,summary=total,promotionPass=all(s['positivePassed']==s['positiveTotal'] and s['negativePassed']==s['negativeTotal'] for s in total.values()) and all(s['calibrationRejected']==len(seeds)*16 for profile,s in total.items() if 'calibration' in profile))
(ROOT/f'evidence/{prefix}-summary.json').write_text(json.dumps(report,indent=2)+'\n')
raise SystemExit(0 if report['promotionPass'] else 1)
