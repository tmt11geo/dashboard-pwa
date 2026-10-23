import unittest
import numpy as np
from fixtures import K
from temporal import Calibration,KeyframeTracker

def calibration(**kwargs):
    return Calibration(**dict(dict(identity='test',width=640,height=480,K=K,source='synthetic',reprojection_rms=0),**kwargs))
def image(i):
    a=np.zeros((480,640),np.uint8);a[0,0]=i;return a
def pose(t=(-1,0,0)):
    return dict(status='pose',reason='validated-pair',R=np.eye(3).tolist(),t=list(t))

class TemporalContracts(unittest.TestCase):
    def test_calibration_requirements(self):
        for options in [dict(source='assumed'),dict(reprojection_rms=1),dict(width=224),dict(undistorted=False),dict(K=np.zeros((3,3)))]:
            with self.assertRaises(ValueError):KeyframeTracker(calibration(**options))
    def test_calibration_is_copied_and_changes_rejected(self):
        k=K.copy();tracker=KeyframeTracker(calibration(K=k));k[0,0]=1
        self.assertEqual(tracker.K[0,0],500)
        with self.assertRaises(ValueError):tracker.push(image(0),0,'other')
    def test_three_consistent_frames_promote_and_reset_anchor(self):
        tracker=KeyframeTracker(calibration(),lambda *args:pose())
        tracker.push(image(0),0,'test')
        self.assertEqual(tracker.push(image(1),1,'test')['status'],'waiting')
        self.assertEqual(tracker.push(image(2),2,'test')['status'],'waiting')
        r=tracker.push(image(3),3,'test')
        self.assertEqual(r['status'],'keyframe');self.assertEqual(r['anchor_id'],0)
        self.assertEqual(tracker.anchor_id,3);self.assertEqual(tracker.pending,[])
    def test_duplicate_and_out_of_order_do_not_confirm(self):
        tracker=KeyframeTracker(calibration(),lambda *args:pose())
        tracker.push(image(0),0,'test');tracker.push(image(1),1,'test')
        self.assertEqual(tracker.push(image(1),2,'test')['reason'],'duplicate-image')
        self.assertEqual(tracker.pending,[])
        with self.assertRaises(ValueError):tracker.push(image(2),2,'test')
    def test_direction_change_restarts_confirmation(self):
        tracker=KeyframeTracker(calibration(),lambda a,b,k:pose((-1,0,0) if b[0,0]<3 else (0,-1,0)))
        tracker.push(image(0),0,'test');tracker.push(image(1),1,'test');tracker.push(image(2),2,'test')
        r=tracker.push(image(3),3,'test')
        self.assertEqual(r['reason'],'direction-inconsistent');self.assertEqual(r['confirmations'],1)
    def test_inconsistent_rotation_cycle_blocks_promotion(self):
        def estimator(a,b,k):
            if a[0,0]>0:
                c,s=np.cos(.05),np.sin(.05)
                return dict(status='rotation_only',reason='rotation-model-supported',R=[[c,-s,0],[s,c,0],[0,0,1]],t=None)
            return pose()
        tracker=KeyframeTracker(calibration(),estimator)
        tracker.push(image(0),0,'test');tracker.push(image(1),1,'test')
        for i in [2,3,4]:
            r=tracker.push(image(i),i,'test')
            self.assertEqual(r['status'],'waiting')
            self.assertEqual(r['reason'],'rotation-cycle-inconsistent')
            self.assertEqual(r['confirmations'],1)
    def test_invalid_frame_does_not_replace_anchor(self):
        tracker=KeyframeTracker(calibration())
        tracker.push(image(0),0,'test')
        with self.assertRaises(ValueError):tracker.push(np.zeros((224,168),np.uint8),1,'test')
        self.assertEqual(tracker.anchor_id,0)
        self.assertEqual(tracker.last_id,0)
    def test_low_parallax_keeps_anchor_and_reset_releases_frames(self):
        tracker=KeyframeTracker(calibration(),lambda *args:dict(status='rejected',reason='low-parallax',R=None,t=None))
        tracker.push(image(0),0,'test');r=tracker.push(image(1),1,'test')
        self.assertIsNone(r['t']);self.assertEqual(tracker.anchor_id,0)
        tracker.reset();self.assertIsNone(tracker.anchor);self.assertIsNone(tracker.previous)
if __name__=='__main__':unittest.main()
