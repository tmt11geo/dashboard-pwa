"""Bounded three-view RGB tracker; triangulated scale is local to each anchor."""
import cv2
import numpy as np
from temporal import KeyframeTracker
from prototype import estimate, rotation_error, angle


def features(image):
    k,d=cv2.SIFT_create(nfeatures=1800,contrastThreshold=.025).detectAndCompute(image,None)
    return np.float64([p.pt for p in k]).reshape(-1,2),d


def matches(a,b):
    if a is None or b is None or min(len(a),len(b))<2:return {}
    matcher=cv2.BFMatcher()
    def one(x,y):
        return {m.queryIdx:m.trainIdx for p in matcher.knnMatch(x,y,k=2) if len(p)==2 for m,n in [p] if m.distance<.72*n.distance}
    ab,ba=one(a,b),one(b,a)
    return {i:j for i,j in ab.items() if ba.get(j)==i}


def triangulate(a,b,K,R,t):
    h=cv2.triangulatePoints(K@np.c_[np.eye(3),np.zeros(3)],K@np.c_[R,t],a.T,b.T)
    valid=np.abs(h[3])>1e-9
    X=np.zeros((len(a),3));X[valid]=(h[:3,valid]/h[3,valid]).T
    second=X@R.T+t
    def error(points,uv):
        p=points@K.T
        return np.linalg.norm(p[:,:2]/np.maximum(p[:,2:],1e-9)-uv,axis=1)
    keep=valid&(X[:,2]>0)&(second[:,2]>0)&(error(X,a)<1)&(error(second,b)<1)
    return X,keep


class RecoveryTracker(KeyframeTracker):
    def __init__(self,calibration):
        from calibration_evidence import VerifiedCalibration
        if not isinstance(calibration,VerifiedCalibration):
            raise ValueError("Independent calibration-target verification is required")
        super().__init__(calibration)

    def seed_failure(self,result,reason,a,b,ab,R,t):
        self.failures+=1
        if self.failures<2:return dict(result,reason=reason)
        ids=list(ab)
        X,keep=triangulate(a[ids],b[list(ab.values())],self.K,R,t)
        if keep.sum()<24:return dict(result,reason=reason)
        self.seed={i:x for i,x,ok in zip(ids,X,keep) if ok}
        self.failures=0
        return dict(result,reason="landmarks-reseeded",previousReason=reason,landmarks=len(self.seed))

    def reset(self):
        super().reset();self.seed=None;self.failures=0;self.anchor_features=None

    def push(self,image,frame_id,calibration_id):
        # Reuse input/lifecycle contract, but not the old promotion policy.
        if calibration_id!=self.identity:raise ValueError('Calibration changed; create a new tracker')
        if image.dtype!=np.uint8 or image.shape!=(480,640):raise ValueError('Unexpected frame format')
        if not isinstance(frame_id,int) or (self.last_id is not None and frame_id<=self.last_id):raise ValueError('Frame IDs must increase')
        import hashlib
        digest=hashlib.sha256(image.tobytes()).hexdigest();self.last_id=frame_id
        if self.anchor is None:
            self.anchor=image.copy();self.anchor_id=frame_id;self.last_hash=digest
            self.anchor_features=features(image)
            return dict(status='anchor',anchor_id=frame_id,R=None,t=None)
        result=dict(status='waiting',anchor_id=self.anchor_id,R=None,t=None)
        if digest==self.last_hash:return dict(result,reason='duplicate-image')
        self.last_hash=digest
        pair=estimate(self.anchor,image,self.K);result['pair']=pair
        if pair['status']!='pose':return dict(result,reason=pair['reason'])
        R=np.array(pair['R']);t=np.array(pair['t']);a,da=self.anchor_features;b,db=features(image)
        ab=matches(da,db)
        if self.seed is None:
            ids=list(ab);X,keep=triangulate(a[ids],b[list(ab.values())],self.K,R,t)
            if keep.sum()<24:return dict(result,reason='triangulation-support')
            self.seed={i:x for i,x,ok in zip(ids,X,keep) if ok}
            return dict(result,reason='landmarks-seeded',landmarks=len(self.seed))
        ids=[i for i in ab if i in self.seed]
        result['sharedLandmarks']=len(ids)
        if len(ids)<24:return self.seed_failure(result,'shared-landmark-support',a,b,ab,R,t)
        X=np.float64([self.seed[i] for i in ids]);uv=b[[ab[i] for i in ids]]
        cv2.setRNGSeed(719)
        ok,rvec,tvec,inliers=cv2.solvePnPRansac(X,uv,self.K,None,iterationsCount=200,reprojectionError=1.,confidence=.999,flags=cv2.SOLVEPNP_EPNP)
        if not ok or inliers is None or len(inliers)<24 or len(inliers)/len(ids)<.6:return self.seed_failure(result,'pnp-consensus',a,b,ab,R,t)
        idx=inliers.ravel();rvec,tvec=cv2.solvePnPRefineLM(X[idx],uv[idx],self.K,None,rvec,tvec)
        Rp=cv2.Rodrigues(rvec)[0];tp=tvec.ravel()
        projected=cv2.projectPoints(X[idx],rvec,tvec,self.K,None)[0].reshape(-1,2)
        residual=float(np.median(np.linalg.norm(projected-uv[idx],axis=1)))
        positive=float(((X[idx]@Rp.T+tp)[:,2]>0).mean())
        coverage=len(set(map(tuple,(uv[idx]/[640/3,480/3]).astype(int))))
        result.update(pnpInliers=len(idx),reprojectionPx=residual,coverage=coverage)
        if np.linalg.norm(tp)<1e-9 or positive<.95 or residual>1 or coverage<5:return self.seed_failure(result,'pnp-geometry',a,b,ab,R,t)
        re=rotation_error(Rp,R);te=angle(tp,t)
        result.update(pairRotationDifference=re,pairDirectionDifference=te)
        if re>1 or te>5:return self.seed_failure(result,'pnp-pair-disagreement',a,b,ab,R,t)
        result.update(status='keyframe',reason='shared-landmark-consensus',R=Rp.tolist(),t=(tp/np.linalg.norm(tp)).tolist())
        self.anchor=image.copy();self.anchor_id=frame_id;self.anchor_features=(b,db);self.seed=None;self.failures=0
        return result
