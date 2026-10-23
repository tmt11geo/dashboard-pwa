import unittest
import cv2
import numpy as np
from fixtures import K,scene,render,rotation
from prototype import estimate,rotation_error

class ContractTests(unittest.TestCase):
    def test_stationary_does_not_invent_translation(self):
        image=render(scene())
        r=estimate(image,image,K)
        self.assertEqual(r['status'],'stationary')
        self.assertIsNone(r['t'])
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
