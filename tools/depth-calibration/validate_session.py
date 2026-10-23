"""Independently re-detect and cross-validate an exported phone session locally.
Usage: python tools/depth-calibration/validate_session.py session.json report.json
Does not trust the browser's passed flag. Never uploads images.
"""
import base64,hashlib,json,sys,struct
from pathlib import Path
import cv2,numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'depth-pose'))
from temporal import Calibration
from calibration_evidence import VerifiedCalibration
cv2.setNumThreads(1)
def validate(bundle):
    if bundle.get('format')!='tactical-camera-calibration' or bundle.get('version')!=1:raise ValueError('Unsupported session format')
    board=bundle.get('board',{})
    if (board.get('columns'),board.get('rows'))!=(9,7):raise ValueError('Unexpected target')
    views=bundle['observations'];geometry=bundle['metadata']['geometry']
    if not 16<=len(views)<=24:raise ValueError('Need 16–24 views')
    if (geometry['outputWidth'],geometry['outputHeight'])!=(640,480) or geometry.get('mirrored') or geometry.get('rotation')!=0:raise ValueError('Unsupported image transform')
    obj=np.float32([[(x+1)*.018,(y+1)*.018,0] for y in range(7) for x in range(9)])
    objects=[];images=[];hashes=[];matches=[]
    for v in views:
        if v['geometry']!=geometry:raise ValueError('Mixed camera geometry/settings')
        image=v['image']
        if not image.startswith('data:image/png;base64,') or len(image)>4000000:raise ValueError('Invalid image')
        raw=base64.b64decode(image.split(',',1)[1],validate=True)
        if raw[:8]!=b'\x89PNG\r\n\x1a\n' or len(raw)<24 or struct.unpack('>II',raw[16:24])!=(640,480):raise ValueError('Invalid PNG dimensions')
        im=cv2.imdecode(np.frombuffer(raw,np.uint8),cv2.IMREAD_GRAYSCALE)
        if im is None or im.shape!=(480,640):raise ValueError('Invalid image dimensions')
        ok,corners=cv2.findChessboardCorners(im,(9,7),cv2.CALIB_CB_ADAPTIVE_THRESH|cv2.CALIB_CB_NORMALIZE_IMAGE|cv2.CALIB_CB_FILTER_QUADS)
        if not ok:raise ValueError('Board not found during independent image replay')
        corners=cv2.cornerSubPix(im,corners,(5,5),(-1,-1),(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_COUNT,40,.001)).reshape(-1,2)
        recorded=np.asarray(v['points'],np.float32).reshape(-1,2)
        if recorded.shape!=(63,2) or not np.isfinite(recorded).all():raise ValueError('Invalid recorded corners')
        error=min(np.sqrt(np.mean(np.sum((recorded-corners)**2,axis=1))),np.sqrt(np.mean(np.sum((recorded-corners[::-1])**2,axis=1))))
        if error>1:raise ValueError('Saved corner measurements disagree with image replay')
        hashes.append(hashlib.sha256(raw).hexdigest());matches.append(float(error));objects.append(obj.copy());images.append(corners)
    if len(set(hashes))!=len(hashes):raise ValueError('Duplicate calibration images')
    rms,K,D,_,_=cv2.calibrateCamera(objects,images,(640,480),None,None,flags=cv2.CALIB_FIX_K3)
    folds=[]
    for parity in [0,1]:
        train=list(range(parity,len(views),2));test=list(range(1-parity,len(views),2))
        frms,fk,fd,rv,_=cv2.calibrateCamera([objects[i] for i in train],[images[i] for i in train],(640,480),None,None,flags=cv2.CALIB_FIX_K3)
        errors=[]
        for i in test:
            ok,r,t=cv2.solvePnP(objects[i],images[i],fk,fd)
            if not ok:raise ValueError('Held-out target pose failed')
            projected=cv2.projectPoints(objects[i],r,t,fk,fd)[0].reshape(-1,2)
            errors.append(float(np.sqrt(np.mean(np.sum((projected-images[i])**2,axis=1)))))
        spread=float(np.max(np.ptp(np.array(rv).reshape(-1,3)[:,:2],axis=0)))
        folds.append(dict(K=fk.tolist(),D=fd.ravel().tolist(),rms=float(frms),heldOutMax=max(errors),rotationSpread=spread))
    a,b=[np.array(f['K']) for f in folds]
    focal=float(max(abs(a[0,0]/b[0,0]-1),abs(a[1,1]/b[1,1]-1)));centre=float(max(abs(a[0,2]-b[0,2]),abs(a[1,2]-b[1,2])))
    quadrants=len({(float(x[:,0].mean())>=320,float(x[:,1].mean())>=240) for x in images})
    passed=np.isfinite(K).all() and np.isfinite(D).all() and rms<=.5 and focal<=.02 and centre<=2 and quadrants==4 and all(f['rms']<=.5 and f['heldOutMax']<=.5 and f['rotationSpread']>=.2 for f in folds)
    verified=None;verificationError=None
    if passed:
        corrected=[cv2.undistortPoints(x[:,None,:],K,D,P=K).reshape(-1,2) for x in images]
        try:
            v=VerifiedCalibration(Calibration(bundle['metadata']['geometry']['deviceId'] or 'captured-camera',640,480,K,'measured',float(rms)),objects,corrected)
            verified=dict(evidenceHash=v.evidence_hash,folds=v.diagnostics)
        except ValueError as e:verificationError=str(e)
    return dict(numericPassed=bool(passed),independentImagesVerified=len(images),maxCornerReplayErrorPx=max(matches),K=K.tolist(),distortion=D.ravel().tolist(),rms=float(rms),folds=folds,focalDisagreement=focal,centreDisagreement=centre,quadrants=quadrants,undistortedEvidence=verified,verificationError=verificationError,focusLocked=bundle['metadata']['focusLock']['locked'],geometry=geometry,imageSha256=hashes,readyForControlledTrackerReplay=bool(passed and verified and bundle['metadata']['focusLock']['locked']),limitations='Target consistency only; not scene-pose accuracy, phone performance, authenticity, or safe scanner deployment. Undistort raw tracking images using K and distortion, preserve exact crop/geometry; do not apply raw calibration to a different camera mode.')
if __name__=='__main__':
    data=Path(sys.argv[1]).read_bytes()
    if len(data)>50000000:raise ValueError('Session too large')
    report=validate(json.loads(data));report['inputSha256']=hashlib.sha256(data).hexdigest();report['opencv']=cv2.__version__
    Path(sys.argv[2]).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['numericPassed','independentImagesVerified','readyForControlledTrackerReplay','rms','verificationError']}))
    raise SystemExit(0 if report['readyForControlledTrackerReplay'] else 1)
