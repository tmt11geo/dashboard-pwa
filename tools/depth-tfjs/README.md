# Depth TFJS conversion environment (stage 2)

This directory prepares the Python toolchain only. It does not download pretrained
weights, convert the model, run WebGL, or change the PWA. See `../../DONE.md` for
the current stage and branch pointer.

## Recreate

Prerequisites: Linux x86_64, CPython 3.12 with venv, a package index reachable by
pip, and several GB of free disk space. No CUDA installation is required for the
CPU conversion toolchain. The first verified interpreter was CPython 3.12.14.

```sh
bash tools/depth-tfjs/setup.sh /tmp/depth-tfjs-env
/tmp/depth-tfjs-env/bin/python tools/depth-tfjs/verify_environment.py
```

Use an absent destination. Setup refuses an existing environment to avoid mixing
dependency metadata. `DEPTH_PYTHON=/path/to/python3.12` selects the interpreter.
Install steps are sequential; do not run pip mutations concurrently.

`requirements.txt` records the intentional top-level pins recovered from the
historical recipe. `requirements.lock.txt` records every resolved installed
distribution (including pip) for this platform and Python version. It is a
version lock, not a hash-verified wheel archive or a cross-platform lock. Package
index availability remains an external requirement.

The verifier asserts all top-level versions, runs `pip check`, imports
`keras_hub.models.DepthAnythingBackbone` and TFJS, checks the TensorFlow Keras
backend and a small TensorFlow operation, then starts the installed converter
with `--help` under a timeout. A failure returns nonzero and does not emit PASS.
It never downloads model weights or tests conversion compatibility.

## Evidence and limitations

Committed evidence lives in `evidence/`. Runtime CUDA/plugin registration warnings
may appear on CPU hosts; success requires the checks above, not a quiet stderr.
TensorFlow Decision Forests 1.12.0 was compiled against TensorFlow 2.19.0. Keep
YDF 0.11.0 with Protobuf 5.29.6 and setuptools 80.9.0 for the converter's legacy
`pkg_resources` dependency. KerasHub 0.22.2 lacks the required backbone.

Stage 3 must still reproduce pretrained fixed-shape conversion and the exact
GELU rewrite. Successful converter startup does not establish that a model can
be exported or executed in a browser.
