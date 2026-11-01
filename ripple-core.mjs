// Image plane is XY; +Z is the water height. Camera looks down -Z.
export function viewFor(width, height, aspect, tiltDegrees, yawDegrees) {
  const tilt = -tiltDegrees * Math.PI / 180, yaw = yawDegrees * Math.PI / 180;
  const c = Math.cos(yaw), s = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
  const f = 1 / Math.tan(Math.PI / 8);
  const rotate = ([x,y,z]) => [c*x-s*y, ct*(s*x+c*y)-st*z, st*(s*x+c*y)+ct*z];
  const inverse = ([x,y,z]) => [c*x+s*(ct*y+st*z), -s*x+c*(ct*y+st*z), -st*y+ct*z];
  let distance = 0;
  for (const x of [-width/2,width/2]) for (const y of [-height/2,height/2]) {
    const p = rotate([x,y,0]);
    distance = Math.max(distance, Math.abs(p[0])*f/aspect+p[2], Math.abs(p[1])*f+p[2]);
  }
  distance = distance*1.18 + .25;
  return {width,height,aspect,f,distance,rotate,inverse,c,s,ct,st};
}
export function project(v, point) {
  const p = v.rotate(point), w = v.distance-p[2];
  return [p[0]*v.f/(v.aspect*w),p[1]*v.f/w];
}
export function hitPlane(v, nx, ny) {
  const o = v.inverse([0,0,v.distance]);
  const d = v.inverse([nx*v.aspect/v.f,ny/v.f,-1]);
  if (Math.abs(d[2]) < 1e-8) return null;
  const t = -o[2]/d[2];
  if (t < 0) return null;
  const x = o[0]+t*d[0], y = o[1]+t*d[1];
  return Math.abs(x)<=v.width/2+1e-8 && Math.abs(y)<=v.height/2+1e-8 ? [x,y] : null;
}
export function imageSize(width,height) {
  const scale = 3/Math.max(width,height);
  return [width*scale,height*scale];
}
