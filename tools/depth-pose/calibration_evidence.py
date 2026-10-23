"""Validate undistorted intrinsics against separate known-target observations.
Evidence is an input, not an authenticity guarantee. Bind it to the real camera,
resolution, crop and focus before use; synthetic evidence is only for fixtures.
"""
import hashlib
import cv2
import numpy as np

class VerifiedCalibration:
    def __init__(self,calibration,objects,pixels):
        self.identity=calibration.identity
        self.K=calibration.checked_matrix()
        if len(objects)!=len(pixels) or len(objects)<12:
            raise ValueError('Need at least 12 independent calibration-target views')
        obj=[];uv=[]
        for a,b in zip(objects,pixels):
            a=np.asarray(a,np.float32);b=np.asarray(b,np.float32)
            if a.ndim!=2 or a.shape[1]!=3 or b.shape!=(len(a),2) or len(a)<30 or not np.isfinite(a).all() or not np.isfinite(b).all():
                raise ValueError('Invalid calibration target observations')
            if np.any(b<0) or np.any(b>=[640,480]):raise ValueError('Target outside image')
            obj.append(a.copy());uv.append(b.copy())
        # Two interleaved folds must independently support the supplied camera.
        flags=cv2.CALIB_ZERO_TANGENT_DIST|cv2.CALIB_FIX_K1|cv2.CALIB_FIX_K2|cv2.CALIB_FIX_K3
        diagnostics=[]
        for fold in [0,1]:
            ids=list(range(fold,len(obj),2));test=list(range(1-fold,len(obj),2))
            if len({hashlib.sha256(uv[i].tobytes()).hexdigest() for i in ids})<6:raise ValueError('Repeated calibration observations')
            rms,k,dist,rv,tv=cv2.calibrateCamera([obj[i] for i in ids],[uv[i] for i in ids],(640,480),None,None,flags=flags)
            rotations=np.array([r.ravel() for r in rv])
            if np.max(np.ptp(rotations[:,:2],axis=0))<.2:raise ValueError('Calibration target needs varied tilt')
            focal=float(np.max(np.abs(np.diag(k)[:2]/np.diag(self.K)[:2]-1)))
            centre=float(np.max(np.abs(k[:2,2]-self.K[:2,2])))
            errors=[]
            for i in test:
                ok,r,t=cv2.solvePnP(obj[i],uv[i],self.K,None)
                if not ok:raise ValueError('Calibration held-out pose failed')
                projected=cv2.projectPoints(obj[i],r,t,self.K,None)[0].reshape(-1,2)
                errors.append(float(np.sqrt(np.mean(np.sum((projected-uv[i])**2,axis=1)))))
            diagnostics.append(dict(rms=float(rms),focalRelativeError=focal,principalPointErrorPx=centre,heldOutMaxRms=max(errors)))
            if not np.isfinite(k).all() or rms>.5 or focal>.02 or centre>2 or max(errors)>.5:
                raise ValueError('Independent target observations do not support supplied intrinsics')
        self.diagnostics=diagnostics
        self.evidence_hash=hashlib.sha256(b''.join(x.tobytes() for pair in zip(obj,uv) for x in pair)).hexdigest()
    def checked_matrix(self):return self.K.copy()
