"""Known-camera checkerboard renders for actual browser detector/calibrator tests."""
from pathlib import Path
import cv2,json,numpy as np
out=Path('/tmp/calibration-fixtures');out.mkdir(exist_ok=True)
K=np.array([[500.,0,319.5],[0,500.,239.5],[0,0,1]])
D=np.array([-.08,.02,0,0,0.])
tex=np.full((600,720),255,np.uint8)
for y in range(8):
 for x in range(10):
  if (x+y)%2==0:tex[60+y*60:120+y*60,60+x*60:120+x*60]=0
corners=np.float32([[-.018,-.018,0],[.198,-.018,0],[.198,.162,0],[-.018,.162,0]])
source=np.float32([[0,0],[720,0],[720,600],[0,600]])
grid=np.stack(np.meshgrid(np.arange(640),np.arange(480)),axis=-1).astype(np.float32)
mapxy=cv2.undistortPoints(grid.reshape(-1,1,2),K,D,P=K).reshape(480,640,2)
rows=[]
for i in range(24):
 quad=[(-1,-1),(1,-1),(-1,1),(1,1)][(i//2)%4]
 r=np.array([.42*np.sin(i*1.7+.3),.46*np.cos(i*1.3+.2),.12*np.sin(i*.7)])
 R=cv2.Rodrigues(r)[0];t=np.array([quad[0]*.065,quad[1]*.045,.38+.03*np.sin(i)])-R@np.array([.09,.072,0])
 uv=cv2.projectPoints(corners,r,t,K,None)[0].reshape(-1,2)
 H=cv2.getPerspectiveTransform(source,uv.astype(np.float32))
 im=cv2.warpPerspective(tex,H,(640,480),borderValue=145)
 im=cv2.remap(im,mapxy[:,:,0],mapxy[:,:,1],cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=145)
 cv2.imwrite(str(out/f'{i:02d}.png'),im)
 rows.append(dict(file=f'{i:02d}.png',rvec=r.tolist(),tvec=t.tolist()))
(out/'truth.json').write_text(json.dumps(dict(K=K.tolist(),D=D.tolist(),views=rows),indent=2))
print(out)
