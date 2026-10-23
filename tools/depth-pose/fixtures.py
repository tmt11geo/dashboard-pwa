"""Deterministic textured planes rendered from independently specified camera poses."""
import cv2
import numpy as np
SIZE=(640,480)
K=np.array([[500.,0,319.5],[0,500.,239.5],[0,0,1]])
def rotation(axis,degrees):
    r=np.zeros(3);r[axis]=np.radians(degrees)
    return cv2.Rodrigues(r)[0]
def scene(seed=42,planar=False):
    rng=np.random.default_rng(seed)
    bounds=[(-6,6,-5,5,8)]
    if not planar: bounds += [(-1.5,-.1,-1.1,1.1,3),(.2,1.8,-.8,.4,4.5),(-.7,1.4,-1.8,-.9,5.5)]
    planes=[]
    for x0,x1,y0,y1,z in bounds:
        tex=rng.integers(20,235,(512,512),dtype=np.uint8)
        tex=cv2.GaussianBlur(tex,(3,3),.65)
        for _ in range(500):
            p=tuple(rng.integers(0,512,2));cv2.circle(tex,p,int(rng.integers(1,8)),int(rng.integers(0,255)),-1)
        corners=np.array([[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],np.float64)
        planes.append((corners,tex))
    return planes
def render(planes,R=np.eye(3),center=np.zeros(3)):
    # R is world -> camera; camera centre is in world coordinates.
    out=np.zeros((480,640),np.uint8)
    source=np.float32([[0,0],[511,0],[511,511],[0,511]])
    for corners,tex in planes:
        points=(corners-center)@R.T
        projected=points@K.T;uv=(projected[:,:2]/projected[:,2:]).astype(np.float32)
        H=cv2.getPerspectiveTransform(source,uv)
        image=cv2.warpPerspective(tex,H,SIZE,flags=cv2.INTER_LINEAR)
        mask=cv2.warpPerspective(np.full_like(tex,255),H,SIZE,flags=cv2.INTER_NEAREST)
        out[mask>0]=image[mask>0]
    return out
def cases():
    yield "stationary",np.eye(3),np.zeros(3),"no_translation"
    for axis,name in enumerate("xyz"):
        for sign in [-1,1]:
            center=np.zeros(3);center[axis]=sign*.15
            yield f"translate_{name}_{sign}",np.eye(3),center,"pose"
            yield f"rotate_{name}_{sign}",rotation(axis,sign*4),np.zeros(3),"no_translation"
    for sign in [-1,1]:
        center=np.array([0.,0.,sign*.5])
        yield f"translate_z_large_{sign}",np.eye(3),center,"pose"
    R=rotation(2,2)@rotation(1,-3)@rotation(0,2)
    yield "combined",R,np.array([.12,-.08,.12]),"pose"
