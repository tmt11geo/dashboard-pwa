"""Offline keyframe selection. Local direction only: no metric/global trajectory."""
from dataclasses import dataclass
import hashlib
import numpy as np
from prototype import estimate,angle,rotation_error

@dataclass(frozen=True)
class Calibration:
    identity: str
    width: int
    height: int
    K: np.ndarray
    source: str
    reprojection_rms: float
    undistorted: bool = True

    def checked_matrix(self):
        k=np.array(self.K,dtype=float,copy=True)
        if not self.identity or self.source not in ('synthetic','measured'):
            raise ValueError('A named measured/synthetic calibration is required; assumed FOV is insufficient')
        if self.width!=640 or self.height!=480 or not self.undistorted:
            raise ValueError('Requires calibrated undistorted 640x480 images')
        if not np.isfinite(self.reprojection_rms) or not 0<=self.reprojection_rms<=.5:
            raise ValueError('Calibration reprojection RMS must be at most 0.5 pixels')
        if k.shape!=(3,3) or not np.isfinite(k).all() or not np.allclose(k[2],[0,0,1]):
            raise ValueError('Invalid intrinsic matrix')
        if not (128<=k[0,0]<=2560 and 128<=k[1,1]<=2560 and 0<=k[0,2]<640 and 0<=k[1,2]<480):
            raise ValueError('Intrinsics outside supported image bounds')
        if abs(k[0,1])+abs(k[1,0])>1e-8:
            raise ValueError('Skewed intrinsics are not supported')
        k.setflags(write=False)
        return k

class KeyframeTracker:
    def __init__(self,calibration,estimator=estimate):
        self.K=calibration.checked_matrix()
        self.identity=calibration.identity
        self.estimator=estimator
        self.reset()

    def reset(self):
        self.anchor=None;self.anchor_id=None;self.previous=None;self.previous_pose=None
        self.last_id=None;self.last_hash=None;self.pending=[]

    def push(self,image,frame_id,calibration_id):
        if calibration_id!=self.identity: raise ValueError('Calibration changed; create a new tracker')
        if image.dtype!=np.uint8 or image.shape!=(480,640): raise ValueError('Unexpected frame format')
        if not isinstance(frame_id,int) or (self.last_id is not None and frame_id<=self.last_id):
            raise ValueError('Frame IDs must increase')
        digest=hashlib.sha256(image.tobytes()).hexdigest()
        self.last_id=frame_id
        if self.anchor is None:
            self.anchor=image.copy();self.anchor_id=frame_id;self.previous=image.copy();self.last_hash=digest
            return dict(status='anchor',anchor_id=frame_id,t=None,R=None)
        if digest==self.last_hash:
            self.pending=[];self.previous_pose=None
            return dict(status='waiting',reason='duplicate-image',anchor_id=self.anchor_id,t=None,R=None)
        self.last_hash=digest
        pair=self.estimator(self.anchor,image,self.K)
        result=dict(status='waiting',reason=pair['reason'],anchor_id=self.anchor_id,t=None,R=None,pair=pair)
        if pair['status']!='pose':
            self.pending=[];self.previous_pose=None;self.previous=image.copy()
            return result
        R=np.array(pair['R']);t=np.array(pair['t'])
        # Camera-centre direction in the anchor frame, so rotations of the
        # current camera do not change the coordinate basis of this comparison.
        direction=-R.T@t;direction/=np.linalg.norm(direction)
        cycle=None
        if self.previous_pose is not None:
            incremental=self.estimator(self.previous,image,self.K)
            if incremental['R'] is not None:
                cycle=rotation_error(R,np.array(incremental['R'])@self.previous_pose)
            if cycle is None or cycle>1.:
                self.pending=[]
                result['reason']='rotation-cycle-inconsistent'
        if self.pending and any(angle(direction,d)>5. for d in self.pending):
            self.pending=[]
            result['reason']='direction-inconsistent'
        self.pending.append(direction);self.previous_pose=R;self.previous=image.copy()
        result.update(confirmations=len(self.pending),rotationCycleDegrees=cycle)
        if len(self.pending)<3:
            if result['reason']=='validated-pair':result['reason']='accumulating-confirmations'
            return result
        result.update(status='keyframe',reason='temporal-consensus',R=pair['R'],t=pair['t'])
        self.anchor=image.copy();self.anchor_id=frame_id;self.previous_pose=None;self.pending=[]
        return result
