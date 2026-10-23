import unittest
import cv2
import numpy as np
from fixtures import K,scene,render,rotation
from prototype import estimate,rotation_error,rotation_model,angle

class ContractTests(unittest.TestCase):
    def test_stationary_does_not_invent_translation(self):
        image=render(scene())
        r=estimate(image,image,K)
        self.assertEqual(r['status'],'stationary')
        self.assertIsNone(r['t'])
    def test_rotation_competitor_with_outlier_correspondences(self):
        rng=np.random.default_rng(24)
        points=np.c_[rng.uniform(-.6,.6,(100,2)),rng.uniform(2,5,100)]
        R=rotation(2,4)@rotation(1,-3)@rotation(0,2)
        def project(p):
            q=p@K.T
            return q[:,:2]/q[:,2:]
        a=project(points);b=project(points@R.T)
        b[:15]=rng.uniform([0,0],[640,480],(15,2))
        got,support,error=rotation_model(a,b,K)
        self.assertLess(rotation_error(got,R),.01)
        self.assertGreaterEqual(support,.85)
        self.assertLess(error,.01)
    def test_rotation_competitor_does_not_explain_clear_parallax(self):
        rng=np.random.default_rng(25)
        points=np.c_[rng.uniform(-.4,.4,(100,2)),rng.uniform(1,7,100)]
        def project(p):
            q=p@K.T
            return q[:,:2]/q[:,2:]
        a=project(points);b=project(points-np.array([.2,0,0]))
        _,support,_=rotation_model(a,b,K)
        self.assertLess(support,.85)
    def test_full_pair_recovers_clear_sideways_motion_at_640(self):
        planes=scene(42);center=np.array([.15,0,0])
        r=estimate(render(planes),render(planes,center=center),K)
        self.assertEqual(r['status'],'pose')
        self.assertLess(rotation_error(np.array(r['R']),np.eye(3)),2)
        self.assertLess(angle(np.array(r['t']),-center),10)
    def test_development_roll_regression_at_224(self):
        planes=scene(903);R=rotation(2,-4)
        images=[cv2.resize(x,(224,168),interpolation=cv2.INTER_AREA) for x in [render(planes),render(planes,R)]]
        k=K.copy();k[:2]*=.35;k[0,2]=(K[0,2]+.5)*.35-.5;k[1,2]=(K[1,2]+.5)*.35-.5
        r=estimate(*images,k)
        self.assertIsNone(r['t'])
        self.assertLess(rotation_error(np.array(r['R']),R),2)
    def test_invalid_calibration_rejected(self):
        image=np.zeros((480,640),np.uint8)
        with self.assertRaises(ValueError): estimate(image,image,np.zeros((3,3)))
    def test_blank_rejects(self):
        image=np.zeros((480,640),np.uint8)
        self.assertEqual(estimate(image,image,K)['status'],'rejected')
    def test_signed_rotations_do_not_invent_translation(self):
        planes=scene();a=render(planes)
        for axis in range(3):
            for sign in [-1,1]:
                R=rotation(axis,sign*4);r=estimate(a,render(planes,R),K)
                self.assertIsNone(r['t'])
                self.assertIsNotNone(r['R'])
                self.assertLess(rotation_error(np.array(r['R']),R),2)
    def test_fixed_input_is_repeatable(self):
        planes=scene();a=render(planes);b=render(planes,center=np.array([.15,0,0]))
        self.assertEqual(estimate(a,b,K),estimate(a,b,K))
if __name__=='__main__': unittest.main()
