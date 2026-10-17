import {exitSide} from './camera-core.js?v=3';
// Several distinct failed frames and elapsed time are required for an edge exit.
export function trackingMiss(lock,now){
 const missedFrames=(lock.missedFrames||0)+1,elapsed=Math.max(0,now-lock.seen);
 return {...lock,missedFrames,missing:true,lost:elapsed>=1600,exit:elapsed>=750&&missedFrames>=5?exitSide(lock.box):null};
}
