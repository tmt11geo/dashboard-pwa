"""Download pinned test inputs into scratch, never into the shipped app."""
import hashlib, io, json, subprocess, sys, urllib.request, zipfile
from pathlib import Path
out = Path(sys.argv[1]).resolve()
out.mkdir(parents=True, exist_ok=True)
assets = [
    ('tf.min.js', 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js', '300dfae273d20b4046f46a06d735688f03675a807561e9bcb5f664eb2f3d2831'),
    ('redwood.zip', 'https://github.com/isl-org/open3d_downloads/releases/download/20220301-data/SampleRedwoodRGBDImages.zip', '4f161ba04d81cbe628fc69dac20552749f1b255b0090fe51c766e5d02355937b'),
]
receipt = []
for name, url, expected in assets:
    data = urllib.request.urlopen(url, timeout=30).read()
    assert hashlib.sha256(data).hexdigest() == expected, name
    (out / name).write_bytes(data)
    receipt.append(dict(name=name, url=url, bytes=len(data), sha256=expected))
    if name.endswith('.zip'):
        destination = out / 'redwood'
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            for item in archive.infolist():
                assert (destination / item.filename).resolve().is_relative_to(destination)
            archive.extractall(destination)
root = Path(__file__).resolve().parents[2]
script = """import {render} from './tests/fixtures/scan-render.mjs';
console.log(JSON.stringify([render(),render(.045,0,[1.4,.3]),render(.09,0,[1.4,.3])].map(f=>({...f,raw:[...f.raw],pixels:[...f.pixels]}))));"""
(out / 'rendered.json').write_bytes(subprocess.check_output(['node', '--input-type=module', '-e', script], cwd=root))
(out / 'fixture-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt, indent=2))
