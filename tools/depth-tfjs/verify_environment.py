"""Stage 2 smoke check; no pretrained download, export or conversion."""
import importlib.metadata as md
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import time

os.environ.setdefault("KERAS_BACKEND", "tensorflow")
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

def main():
    if sys.version_info[:2] != (3, 12):
        raise RuntimeError("Use CPython 3.12 for this environment")
    if os.environ["KERAS_BACKEND"] != "tensorflow":
        raise RuntimeError("KERAS_BACKEND must be tensorflow")
    packages = {}
    for line in Path(__file__).with_name("requirements.txt").read_text().splitlines():
        if not line or line.startswith("#"):
            continue
        name, expected = line.split("==")
        actual = md.version(name)
        if actual != expected:
            raise RuntimeError(f"{name}: expected {expected}, got {actual}")
        packages[name] = actual
    check = subprocess.run([sys.executable, "-m", "pip", "check"],
                           capture_output=True, text=True, timeout=60, check=True)
    import tensorflow as tf
    import keras
    from keras_hub.models import DepthAnythingBackbone
    import tensorflowjs
    assert keras.backend.backend() == "tensorflow"
    assert float(tf.reduce_sum(tf.constant([1., 2.]))) == 3.
    converter = Path(sys.executable).parent / "tensorflowjs_converter"
    help_result = subprocess.run([str(converter), "--help"],
                                 capture_output=True, text=True, timeout=120, check=True)
    if "--input_format" not in help_result.stdout:
        raise RuntimeError("Converter help missing expected input_format argument")
    result = {
        "stage": 2, "status": "PASS", "utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "python": platform.python_version(), "platform": platform.platform(),
        "machine": platform.machine(), "packages": packages,
        "pip_check": check.stdout.strip(),
        "depth_anything_class": f"{DepthAnythingBackbone.__module__}.{DepthAnythingBackbone.__name__}",
        "keras_backend": keras.backend.backend(), "tensorflow_smoke_sum": 3.0,
        "converter_help_exit": help_result.returncode,
        "converter_version": tensorflowjs.__version__,
        "scope": "Environment only; no pretrained weights, model conversion or WebGL execution",
    }
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
