import unittest
import numpy as np
from fixtures import K,rotation
from three_view import triangulate,ThreeViewTracker
from temporal import Calibration
class ThreeViewTests(unittest.TestCase):
    def test_triangulation_coordinates(self):
        rng=np.random.default_rng(43);X=rng.uniform([-1,-1,3],[1,1,7],(80,3));R=rotation(1,4);t=np.array([-.2,.03,.01])
        def project(x):
            p=x@K.T;return p[:,:2]/p[:,2:]
        recovered,keep=triangulate(project(X),project(X@R.T+t),K,R,t)
        self.assertTrue(keep.all());np.testing.assert_allclose(recovered,X,atol=1e-8)
    def test_behind_camera_rejected(self):
        X=np.array([[.1,.2,-3.],[.2,.1,-4.]])
        def project(x):
            p=x@K.T;return p[:,:2]/p[:,2:]
        _,keep=triangulate(project(X),project(X+[-.2,0,0]),K,np.eye(3),np.array([-.2,0,0]))
        self.assertFalse(keep.any())
    def test_duplicate_and_reset(self):
        tracker=ThreeViewTracker(Calibration('test',640,480,K,'synthetic',0));im=np.zeros((480,640),np.uint8)
        tracker.push(im,0,'test');self.assertEqual(tracker.push(im,1,'test')['reason'],'duplicate-image')
        with self.assertRaises(ValueError):tracker.push(im,1,'test')
        with self.assertRaises(ValueError):tracker.push(im,2,'changed')
        tracker.reset();self.assertIsNone(tracker.seed);self.assertEqual(tracker.push(im,0,'test')['status'],'anchor')
if __name__=='__main__':unittest.main()
