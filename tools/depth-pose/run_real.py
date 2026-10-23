"""Pinned Redwood RGB sanity replay; no claimed pose ground truth or depth input."""
import argparse,hashlib,json
from pathlib import Path
import cv2
import numpy as np
from prototype import estimate
p=argparse.ArgumentParser();p.add_argument('fixtures');args=p.parse_args()
root=Path(args.fixtures); archive=root/'redwood.zip'
expected='4f161ba04d81cbe628fc69dac20552749f1b255b0090fe51c766e5d02355937b'
assert hashlib.sha256(archive.read_bytes()).hexdigest()==expected
cal=json.loads((root/'redwood/camera_primesense.json').read_text())
K=np.array(cal['intrinsic_matrix']).reshape(3,3,order='F')
rows=[]
for i,j in [(0,1),(0,2),(0,3),(0,4)]:
    paths=[root/f'redwood/color/{n:05}.jpg' for n in [i,j]]
    images=[cv2.imread(str(x),cv2.IMREAD_GRAYSCALE) for x in paths]
    assert all(x is not None and x.shape==(cal['height'],cal['width']) for x in images)
    rows.append(dict(pair=[i,j],imageSha256=[hashlib.sha256(x.read_bytes()).hexdigest() for x in paths],estimate=estimate(*images,K)))
report=dict(source='Open3D SampleRedwoodRGBDImages pinned archive',archiveSha256=expected,scope='RGB and provided calibration only; no depth, no fusion, no ground-truth accuracy claim',pairs=rows)
Path(__file__).with_name('evidence').joinpath('real.json').write_text(json.dumps(report,indent=2)+'\n')
print([(x['pair'],x['estimate']['status'],x['estimate']['reason']) for x in rows])
