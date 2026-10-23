"""Separate calibration target; never uses tracking frames or tracking poses."""
import cv2
import numpy as np
from fixtures import K

def observations(seed=97531):
    rng=np.random.default_rng(seed)
    target=np.zeros((63,3),np.float32)
    target[:,:2]=np.mgrid[-4:5,-3:4].T.reshape(-1,2)*.04
    objects=[];pixels=[]
    for i in range(16):
        r=np.array([.28*np.sin(i*1.7),.35*np.cos(i*1.3),.08*np.sin(i)])
        t=np.array([.07*np.sin(i),.04*np.cos(i),.65+.03*(i%4)])
        uv=cv2.projectPoints(target,r,t,K,None)[0].reshape(-1,2)
        uv+=rng.normal(0,.06,uv.shape)
        objects.append(target.copy());pixels.append(uv.astype(np.float32))
    return objects,pixels
