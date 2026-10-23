"""Offline RGB-only pair pose. Optical axes: right, down, forward.
Returns X_second = R @ X_first + t. Translation is a unit direction, never metres.
No depth input, fusion, browser dependency or production integration.
"""
import cv2
import numpy as np

def angle(a, b):
    return float(np.degrees(np.arccos(np.clip(np.dot(a,b)/(np.linalg.norm(a)*np.linalg.norm(b)), -1, 1))))

def rotation_error(a,b):
    return float(np.degrees(np.arccos(np.clip((np.trace(a@b.T)-1)/2,-1,1))))

def estimate(first, second, K):
    if first.ndim!=2 or second.shape!=first.shape or first.dtype!=np.uint8 or second.dtype!=np.uint8:
        raise ValueError('Expected same-sized uint8 grayscale images')
    if K.shape!=(3,3) or not np.isfinite(K).all() or K[0,0]<=0 or K[1,1]<=0 or abs(np.linalg.det(K))<1e-9:
        raise ValueError('Expected finite nonsingular calibrated intrinsics')
    cv2.setRNGSeed(719)
    detector=cv2.SIFT_create(nfeatures=1800, contrastThreshold=.025)
    ka,da=detector.detectAndCompute(first,None)
    kb,db=detector.detectAndCompute(second,None)
    result={"status":"rejected","reason":"features","features":[len(ka),len(kb)],"R":None,"t":None}
    if da is None or db is None or min(len(da),len(db))<20: return result
    matcher=cv2.BFMatcher()
    def good(a,b):
        return {m.queryIdx:m.trainIdx for pair in matcher.knnMatch(a,b,k=2) if len(pair)==2 for m,n in [pair] if m.distance<.72*n.distance}
    ab,ba=good(da,db),good(db,da)
    pairs=[(i,j) for i,j in ab.items() if ba.get(j)==i]
    result["matches"]=len(pairs)
    if len(pairs)<24: return result
    a=np.float64([ka[i].pt for i,j in pairs]); b=np.float64([kb[j].pt for i,j in pairs])
    if np.median(np.linalg.norm(a-b,axis=1))<.3:
        return {**result,"status":"stationary","reason":"negligible-image-motion","R":np.eye(3).tolist()}
    H,hm=cv2.findHomography(a,b,cv2.RANSAC,1.0)
    hr=float(hm.mean()) if hm is not None else 0
    result["homographyRatio"]=hr
    # A single-plane explanation does not provide reliable translation here.
    if H is not None and hr>.9:
        calibrated=np.linalg.inv(K)@H@K
        calibrated/=np.cbrt(np.linalg.det(calibrated))
        u,s,v=np.linalg.svd(calibrated)
        R=u@v
        if np.linalg.det(R)<0: u[:,-1]*=-1; R=u@v
        result["homographySingularSpread"]=float(s.max()-s.min())
        return {**result,"status":"rotation_or_planar","reason":"translation-unobservable","R":R.tolist(),"t":None}
    E,mask=cv2.findEssentialMat(a,b,K,method=cv2.RANSAC,prob=.999,threshold=.75)
    if E is None or E.shape!=(3,3): return {**result,"reason":"essential"}
    # OpenCV's default distance cutoff is 50 unit baselines, not metres.
    # Use a broad finite bound here and enforce measured parallax below.
    count,R,t,posemask,_=cv2.recoverPose(E,a,b,K,distanceThresh=10000.,mask=mask.copy())
    keep=posemask.ravel()!=0
    result.update(inliers=int(count),inlierRatio=float(keep.mean()))
    if count<24 or keep.mean()<.6: return {**result,"reason":"cheirality-consensus"}
    ai=cv2.undistortPoints(a[keep,None,:],K,None).reshape(-1,2)
    bi=cv2.undistortPoints(b[keep,None,:],K,None).reshape(-1,2)
    ar=np.c_[ai,np.ones(len(ai))]; br=np.c_[bi,np.ones(len(bi))]
    ar=ar@R.T
    ar/=np.linalg.norm(ar,axis=1)[:,None];br/=np.linalg.norm(br,axis=1)[:,None]
    parallax=np.degrees(np.arccos(np.clip((ar*br).sum(axis=1),-1,1)))
    result["medianParallaxDegrees"]=float(np.median(parallax))
    if np.median(parallax)<.5: return {**result,"reason":"low-parallax"}
    # Require spatially distributed matches, not one moving object/corner.
    cells=set(map(tuple,(b[keep]/np.array([second.shape[1]/3,second.shape[0]/3])).astype(int)))
    if len(cells)<5: return {**result,"reason":"coverage"}
    return {**result,"status":"pose","reason":"validated-pair","R":R.tolist(),"t":t.ravel().tolist()}
