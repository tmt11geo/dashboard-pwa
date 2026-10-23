import unittest
from unittest.mock import patch
import numpy as np
from temporal import Calibration
from calibration_evidence import VerifiedCalibration
from calibration_fixtures import observations
from fixtures import K
from recovery import RecoveryTracker
class RecoveryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.obj,cls.uv=observations();cls.cal=Calibration('fixture',640,480,K,'synthetic',0)
        cls.verified=VerifiedCalibration(cls.cal,cls.obj,cls.uv)
    def test_supported_intrinsics(self):
        self.assertEqual(len(self.verified.diagnostics),2)
        self.assertLess(max(d['heldOutMaxRms'] for d in self.verified.diagnostics),.5)
    def test_wrong_intrinsics(self):
        for scale,shift in [(1.15,8),(.9,-6),(1.05,0),(1,5)]:
            k=K.copy();k[0,0]*=scale;k[1,1]*=scale;k[0,2]+=shift
            with self.assertRaises(ValueError):VerifiedCalibration(Calibration('bad',640,480,k,'synthetic',0),self.obj,self.uv)
    def test_missing_and_repeated_observations(self):
        with self.assertRaises(ValueError):VerifiedCalibration(self.cal,[],[])
        with self.assertRaises(ValueError):VerifiedCalibration(self.cal,[self.obj[0]]*12,[self.uv[0]]*12)
        with self.assertRaises(ValueError):RecoveryTracker(self.cal)
    def test_reseed_after_two_failures_never_promotes(self):
        tracker=RecoveryTracker(self.verified);tracker.seed={999:np.ones(3)};tracker.anchor_id=7
        points=np.ones((30,2));ab={i:i for i in range(30)}
        with patch('recovery.triangulate',return_value=(np.ones((30,3)),np.ones(30,bool))):
            event=dict(status='waiting',R=None,t=None,anchor_id=7)
            first=tracker.seed_failure(event,'pnp-consensus',points,points,ab,np.eye(3),np.ones(3))
            self.assertEqual(first['reason'],'pnp-consensus');self.assertIn(999,tracker.seed)
            second=tracker.seed_failure(event,'pnp-consensus',points,points,ab,np.eye(3),np.ones(3))
            self.assertEqual(second['reason'],'landmarks-reseeded');self.assertEqual(second['status'],'waiting');self.assertIsNone(second['t']);self.assertNotIn(999,tracker.seed);self.assertEqual(tracker.anchor_id,7)
        tracker.reset();self.assertIsNone(tracker.seed);self.assertIsNone(tracker.anchor_features)
if __name__=='__main__':unittest.main()
