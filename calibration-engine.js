/* Local OpenCV geometry. No network and no camera access in this module. */
(() => {
  const COLS=9, ROWS=7, COUNT=COLS*ROWS;
  const objects=()=>Array.from({length:COUNT},(_,i)=>[(i%COLS+1)*.018,(Math.floor(i/COLS)+1)*.018,0]).flat();
  function stats(points) {
    const xs=points.filter((_,i)=>!(i%2)),ys=points.filter((_,i)=>i%2);
    return {x:xs.reduce((a,b)=>a+b,0)/COUNT,y:ys.reduce((a,b)=>a+b,0)/COUNT,width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
  }
  function detect(cv, pixels, existing=[]) {
    const rgba=cv.matFromArray(480,640,cv.CV_8UC4,pixels),gray=new cv.Mat(),corners=new cv.Mat();
    try {
      cv.cvtColor(rgba,gray,cv.COLOR_RGBA2GRAY);
      const found=cv.findChessboardCorners(gray,new cv.Size(COLS,ROWS),corners,cv.CALIB_CB_ADAPTIVE_THRESH|cv.CALIB_CB_NORMALIZE_IMAGE|cv.CALIB_CB_FILTER_QUADS|cv.CALIB_CB_FAST_CHECK);
      if(!found||corners.data32F.length!==COUNT*2)return {accepted:false,reason:'Whole board not found. Show all squares and the white border; improve light and hold still.'};
      cv.cornerSubPix(gray,corners,new cv.Size(5,5),new cv.Size(-1,-1),new cv.TermCriteria(cv.TermCriteria_EPS+cv.TermCriteria_COUNT,40,.001));
      const points=Array.from(corners.data32F),s=stats(points);
      if(s.width<140||s.height<100||points.some((v,i)=>v<8||v>(i%2?472:632)))return {accepted:false,reason:'Board too small or too close to an edge. Fill roughly half the view and keep its white border visible.'};
      for(const view of existing) {
        const distances=[false,true].map(reverse=>Math.sqrt(points.reduce((sum,v,i)=>sum+(v-view.points[reverse?(COUNT-1-Math.floor(i/2))*2+i%2:i])**2,0)/COUNT));
        if(Math.min(...distances)<8)return {accepted:false,reason:'Too similar to a saved view. Move the board to another position or change its tilt.'};
      }
      return {accepted:true,points,board:s};
    } finally {rgba.delete();gray.delete();corners.delete();}
  }
  function fit(cv,views) {
    const ov=new cv.MatVector(),iv=new cv.MatVector(),rv=new cv.MatVector(),tv=new cv.MatVector(),K=cv.Mat.eye(3,3,cv.CV_64F),D=new cv.Mat(),owned=[];
    try {
      for(const v of views){const o=cv.matFromArray(COUNT,3,cv.CV_32F,objects()),i=cv.matFromArray(COUNT,1,cv.CV_32FC2,v.points);owned.push(o,i);ov.push_back(o);iv.push_back(i);}
      const rms=cv.calibrateCamera(ov,iv,new cv.Size(640,480),K,D,rv,tv,cv.CALIB_FIX_K3);
      const rotations=[];
      for(let i=0;i<rv.size();i++){const r=rv.get(i);rotations.push(Array.from(r.data64F));r.delete();}
      return {K:Array.from(K.data64F),distortion:Array.from(D.data64F),rms,rotations};
    } finally {for(const x of owned)x.delete();for(const x of [ov,iv,rv,tv,K,D])x.delete();}
  }
  function errors(cv,views,fitResult) {
    const o=cv.matFromArray(COUNT,3,cv.CV_32F,objects()),K=cv.matFromArray(3,3,cv.CV_64F,fitResult.K),D=cv.matFromArray(1,fitResult.distortion.length,cv.CV_64F,fitResult.distortion);
    try{return views.map(v=>{
      const points=cv.matFromArray(COUNT,1,cv.CV_32FC2,v.points),r=new cv.Mat(),t=new cv.Mat(),projected=new cv.Mat();
      try {
        if(!cv.solvePnP(o,points,K,D,r,t,false,cv.SOLVEPNP_ITERATIVE))return Infinity;
        cv.projectPoints(o,r,t,K,D,projected);
        return Math.sqrt(v.points.reduce((sum,x,i)=>sum+(x-projected.data32F[i])**2,0)/COUNT);
      }finally{for(const x of [points,r,t,projected])x.delete();}
    });} finally{o.delete();K.delete();D.delete();}
  }
  function calibrate(cv,views) {
    if(views.length<16)throw Error('Capture at least 16 different views first.');
    if(views.length>24||views.some(v=>v.points?.length!==COUNT*2||!v.points.every(Number.isFinite)))throw Error('Invalid calibration observations.');
    const full=fit(cv,views),folds=[0,1].map(parity=>{
      const train=views.filter((_,i)=>i%2===parity),test=views.filter((_,i)=>i%2!==parity),f=fit(cv,train);
      const rotationSpread=Math.max(...[0,1].map(axis=>Math.max(...f.rotations.map(r=>r[axis]))-Math.min(...f.rotations.map(r=>r[axis]))));
      return {...f,heldOutErrors:errors(cv,test,f),rotationSpread};
    });
    const reasons=[];
    const finite=[...full.K,...full.distortion,full.rms,...folds.flatMap(f=>[...f.K,...f.distortion,f.rms,...f.heldOutErrors])].every(Number.isFinite);
    if(!finite)reasons.push('Calibration is numerically unstable.');
    if(full.K[0]<128||full.K[0]>2560||full.K[4]<128||full.K[4]>2560||full.K[2]<0||full.K[2]>=640||full.K[5]<0||full.K[5]>=480)reasons.push('Camera geometry is implausible.');
    if(full.rms>.5||folds.some(f=>f.rms>.5||Math.max(...f.heldOutErrors)>.5))reasons.push('Reprojection error is too high. Use a flat board, sharper views and even lighting.');
    const focalDisagreement=Math.max(...[0,4].map(i=>Math.abs(folds[0].K[i]/folds[1].K[i]-1)));
    const centreDisagreement=Math.max(...[2,5].map(i=>Math.abs(folds[0].K[i]-folds[1].K[i])));
    if(focalDisagreement>.02||centreDisagreement>2)reasons.push('Independent view groups disagree. Add views with different left/right and up/down tilts.');
    if(folds.some(f=>f.rotationSpread<.2))reasons.push('More tilted views are needed.');
    const quadrants=new Set(views.map(v=>{const s=stats(v.points);return `${s.x>=320}:${s.y>=240}`;}));
    if(quadrants.size<4)reasons.push('Move the board centre into all four quarters of the camera view.');
    return {passed:!reasons.length,reasons,imageSize:{width:640,height:480},cameraMatrix:full.K,distortion:full.distortion,rms:full.rms,folds:folds.map(({K,distortion,rms,heldOutErrors,rotationSpread})=>({K,distortion,rms,heldOutErrors,rotationSpread})),focalDisagreement,centreDisagreement,quadrants:quadrants.size,model:'OpenCV pinhole, k1 k2 p1 p2; k3 fixed',undistorted:false};
  }
  globalThis.CalibrationEngine={detect,calibrate,stats,objects,COLS,ROWS};
})();
