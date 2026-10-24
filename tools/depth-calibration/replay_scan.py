"""Replay a private calibrated capture using independently verified calibration.
Usage: python replay_scan.py CALIBRATION_SESSION SCAN_REPLAY REPORT
Never commits/uploads input images. Results are not ground-truth pose accuracy.
"""
import sys,json,base64,hashlib,struct
from pathlib import Path
import cv2,numpy as np
from validate_session import validate
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'depth-pose'))
from temporal import Calibration
from calibration_evidence import VerifiedCalibration
from recovery import RecoveryTracker

def main():
    raw=Path(sys.argv[1]).read_bytes()
    if len(raw)>50000000:raise ValueError('Calibration session too large')
    session=json.loads(raw);verification=validate(session)
    if not verification['readyForControlledTrackerReplay']:raise ValueError('Calibration replay did not pass')
    replay_bytes=Path(sys.argv[2]).read_bytes()
    if len(replay_bytes)>50000000:raise ValueError('Scan replay too large')
    replay=json.loads(replay_bytes)
    if replay.get('format')!='tactical-calibrated-replay' or replay.get('version')!=1:raise ValueError('Invalid replay')
    profile=replay['calibration']
    if profile['inputSha256']!=hashlib.sha256(raw).hexdigest() or profile['geometry']!=session['metadata']['geometry']:raise ValueError('Calibration binding mismatch')
    K=np.array(verification['K']);D=np.array(verification['distortion']);objects=[];corners=[]
    obj=np.float32([[(x+1)*.018,(y+1)*.018,0] for y in range(7) for x in range(9)])
    for v in session['observations']:
        objects.append(obj.copy());corners.append(cv2.undistortPoints(np.float32(v['points']).reshape(-1,1,2),K,D,P=K).reshape(-1,2))
    verified=VerifiedCalibration(Calibration('phone-replay',640,480,K,'measured',verification['rms']),objects,corners)
    tracker=RecoveryTracker(verified);results=[]
    frames=replay['frames']
    if not 1<=len(frames)<=12:raise ValueError('Invalid frame count')
    for i,f in enumerate(frames):
        if not f['image'].startswith('data:image/png;base64,') or len(f['image'])>4000000:raise ValueError('Invalid image')
        image=base64.b64decode(f['image'].split(',')[1],validate=True)
        if image[:8]!=b'\x89PNG\r\n\x1a\n' or struct.unpack('>II',image[16:24])!=(640,480):raise ValueError('Invalid PNG')
        gray=cv2.imdecode(np.frombuffer(image,np.uint8),0)
        if gray is None or gray.shape!=(480,640):raise ValueError('Invalid frame')
        result=tracker.push(cv2.undistort(gray,K,D),i,'phone-replay');results.append(result)
    def encode(x):
        if isinstance(x,np.ndarray):return x.tolist()
        if isinstance(x,np.generic):return x.item()
        raise TypeError(type(x).__name__)
    Path(sys.argv[3]).write_text(json.dumps({'frames':results,'inputSha256':hashlib.sha256(Path(sys.argv[2]).read_bytes()).hexdigest(),'limitations':'No ground-truth poses; replay diagnostics only. No fusion promotion from acceptance counts.'},default=encode,indent=2)+'\n')
if __name__=='__main__':main()
