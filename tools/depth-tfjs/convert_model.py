"""Pinned Depth Anything V2 Small -> fixed-224 TFJS graph (stage 3 only)."""
import argparse
from collections import Counter
import hashlib
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
os.environ.setdefault("TF_NUM_INTRAOP_THREADS", "2")
os.environ.setdefault("TF_NUM_INTEROP_THREADS", "2")

REVISION = "0fa3d627036ffe8029b34850dbdab5028696f011"
BASE = f"https://huggingface.co/keras/depth_anything_v2_small/resolve/{REVISION}/"
SOURCE = {
    "config.json": (2266, "c9fe5d3b68ff71854f08f378228ab6f60217b82964a5bd8bf3f0f6c60d03ac75"),
    "model.weights.h5": (102051640, "7367dabc7e0e28512aea7d94f845dba542e4bdd88142debf580cc98c8d683b49"),
    "README.md": (4720, "96e49b7f17fdb5c5adbb9740ea6581f699be39f03bb327bac03cdc0ed2de126d"),
}

def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return {"bytes": path.stat().st_size, "sha256": h.hexdigest()}

def fetch_sources(directory):
    import requests
    directory.mkdir(parents=True, exist_ok=True)
    result = {}
    for name, (size, expected) in SOURCE.items():
        path = directory / name
        if not path.exists():
            temporary = path.with_suffix(path.suffix + ".part")
            with requests.get(BASE + name, stream=True, timeout=(20, 60)) as r:
                r.raise_for_status()
                with temporary.open("wb") as f:
                    for chunk in r.iter_content(1024 * 1024):
                        f.write(chunk)
            actual = digest(temporary)
            if actual != {"bytes": size, "sha256": expected}:
                raise RuntimeError(f"Source integrity failed: {name}: {actual}")
            temporary.replace(path)
        actual = digest(path)
        if actual != {"bytes": size, "sha256": expected}:
            raise RuntimeError(f"Source integrity failed: {name}: {actual}")
        result[name] = {"url": BASE + name, **actual}
    return result

def make_backbone(source):
    import keras
    import keras_hub  # Registers all deserializable backbone classes.
    config = json.loads((source / "config.json").read_text())
    config["config"]["image_encoder"]["config"]["image_shape"] = [224, 224, 3]
    model = keras.saving.deserialize_keras_object(config)
    model.load_weights(str(source / "model.weights.h5"), skip_mismatch=False)
    if model.count_params() != 24883777:
        raise RuntimeError(f"Unexpected parameter count: {model.count_params()}")
    return model

def rewrite_gelu(model):
    import tensorflow as tf
    import keras
    def exact_erf_gelu(x):
        return 0.5 * x * (1.0 + tf.math.erf(x / tf.sqrt(tf.cast(2.0, x.dtype))))
    changed = []
    for layer in model._flatten_layers(include_self=False, recursive=True):
        if isinstance(layer, keras.layers.Dense) and layer.activation == keras.activations.gelu:
            layer.activation = exact_erf_gelu
            changed.append(layer.path)
    if len(changed) != 12:
        raise RuntimeError(f"Expected 12 exact GELU Dense layers, found {len(changed)}")
    return changed

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True,
                        help="Must not exist. Retain this directory for later stages.")
    args = parser.parse_args()
    if args.output_dir.exists():
        parser.error("Output directory already exists; choose a new one")
    if sys.version_info[:2] != (3, 12) or os.environ["KERAS_BACKEND"] != "tensorflow":
        raise RuntimeError("CPython 3.12 and KERAS_BACKEND=tensorflow required")
    for line in Path(__file__).with_name("requirements.txt").read_text().splitlines():
        if line and not line.startswith("#"):
            name, version = line.split("==")
            if md.version(name) != version:
                raise RuntimeError(f"Unexpected {name} version; use setup.sh")
    source_files = fetch_sources(args.source_dir)
    args.output_dir.mkdir(parents=True)
    import tensorflow as tf
    import keras
    import numpy as np
    keras.utils.set_random_seed(1729)
    model = make_backbone(args.source_dir)
    print("Strict pretrained weights loaded", flush=True)
    # Stage 3 rewrite smoke test, not the representative-image validation in stage 4.
    images = np.random.default_rng(1729).uniform(0., 1., (1, 224, 224, 3)).astype("float32")
    images = (images - np.array([.485, .456, .406], dtype="float32")) / np.array([.229, .224, .225], dtype="float32")
    original = tf.nn.relu(model(tf.constant(images), training=False)).numpy()
    changed = rewrite_gelu(model)
    rewritten = tf.nn.relu(model(tf.constant(images), training=False)).numpy()
    error = np.abs(original - rewritten)
    if not np.isfinite(original).all() or not np.isfinite(rewritten).all():
        raise RuntimeError("Non-finite rewrite smoke output")
    if original.shape != (1, 224, 224, 1) or float(error.max()) > 1e-4:
        raise RuntimeError(f"Rewrite smoke failure: shape {original.shape}, max error {error.max()}")
    np.savez(args.output_dir / "gelu-smoke.npz", images=images, original=original, rewritten=rewritten)
    print(f"GELU rewrite max absolute error: {error.max()}", flush=True)

    class Serving(tf.Module):
        def __init__(self, backbone):
            super().__init__()
            self.backbone = backbone
        @tf.function(input_signature=[tf.TensorSpec([1, 224, 224, 3], tf.float32, name="images")])
        def serve(self, images):
            return {"depth": tf.nn.relu(self.backbone(images, training=False))}

    module = Serving(model)
    concrete = module.serve.get_concrete_function()
    definition = concrete.graph.as_graph_def()
    nodes = list(definition.node)
    for function in definition.library.function:
        nodes.extend(function.node_def)
    saved_ops = dict(sorted(Counter(node.op for node in nodes).items()))
    if "Erfc" in saved_ops:
        raise RuntimeError("Unsupported Erfc remains in export graph")
    saved = args.output_dir / "saved-model"
    tf.saved_model.save(module, str(saved), signatures={"serving_default": concrete})
    print("SavedModel exported; starting converter", flush=True)
    converter = Path(sys.executable).parent / "tensorflowjs_converter"
    graph_dir = args.output_dir / "graph-model"
    command = [str(converter), "--input_format=tf_saved_model", "--output_format=tfjs_graph_model",
               "--signature_name=serving_default", "--saved_model_tags=serve",
               "--weight_shard_size_bytes=4194304", str(saved), str(graph_dir)]
    with (args.output_dir / "converter.stdout.log").open("w") as out, (args.output_dir / "converter.stderr.log").open("w") as err:
        subprocess.run(command, stdout=out, stderr=err, timeout=600, check=True)
    graph = json.loads((graph_dir / "model.json").read_text())
    signature = graph["signature"]
    for group, name, expected_shape in [("inputs", "images", [1, 224, 224, 3]),
                                        ("outputs", "depth", [1, 224, 224, 1])]:
        spec = signature[group][name]
        shape = [int(d["size"]) for d in spec["tensorShape"]["dim"]]
        if spec["dtype"] != "DT_FLOAT" or shape != expected_shape:
            raise RuntimeError(f"Unexpected TFJS {group} signature: {spec}")
    graph_ops = dict(sorted(Counter(node["op"] for node in graph["modelTopology"]["node"]).items()))
    if "Erfc" in graph_ops or "Erf" not in graph_ops:
        raise RuntimeError("Unexpected GELU operation inventory")
    manifest_paths = [path for group in graph["weightsManifest"] for path in group["paths"]]
    actual_shards = sorted(p.name for p in graph_dir.glob("*.bin"))
    if len(manifest_paths) != len(set(manifest_paths)) or sorted(manifest_paths) != actual_shards:
        raise RuntimeError("Shard manifest does not match output files")
    graph_files = {p.name: digest(p) for p in sorted(graph_dir.iterdir()) if p.is_file()}
    if any(graph_files[name]["bytes"] > 4194304 for name in actual_shards):
        raise RuntimeError("Shard exceeds configured size limit")
    dtype_bytes = {"float32": 4, "int32": 4, "bool": 1, "complex64": 8}
    manifest_bytes = sum(int(np.prod(weight["shape"])) * dtype_bytes[weight["dtype"]]
                         for group in graph["weightsManifest"] for weight in group["weights"])
    if manifest_bytes != sum(graph_files[name]["bytes"] for name in actual_shards):
        raise RuntimeError("Manifest weight byte count does not match shard byte count")
    report = {
        "stage": 3, "status": "PASS", "utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "python": platform.python_version(), "source_model": "keras/depth_anything_v2_small",
        "source_revision": REVISION, "source_files": source_files,
        "parameter_count": model.count_params(), "strict_weight_loading": True,
        "input": {"name": "images", "shape": [1, 224, 224, 3], "dtype": "float32",
                  "preprocessing_external": "RGB /255, mean [.485,.456,.406], std [.229,.224,.225]"},
        "output": {"key": "depth", "shape": [1, 224, 224, 1], "dtype": "float32", "activation": "ReLU", "units": "relative inverse depth"},
        "gelu_rewrite": {"formula": "0.5*x*(1+erf(x/sqrt(2)))", "layers": changed,
                         "fixture": "seed 1729 uniform RGB, ImageNet normalized; smoke only",
                         "max_abs_error": float(error.max()), "mae": float(error.mean()),
                         "max_abs_threshold": 1e-4, "threshold_reason": "Conservative float32 rewrite smoke bound; representative images and relative thresholds belong to stage 4",
                         "source_range": [float(original.min()), float(original.max())]},
        "saved_model_operations": saved_ops, "graph_operations": graph_ops,
        "tfjs_signature": graph.get("signature"), "format": graph["format"],
        "generated_by": graph.get("generatedBy"), "converted_by": graph.get("convertedBy"),
        "shard_size_limit": 4194304, "shard_count": len(actual_shards),
        "manifest_weight_bytes": manifest_bytes, "manifest_complete": True,
        "graph_files": graph_files, "graph_total_bytes": sum(x["bytes"] for x in graph_files.values()),
        "saved_model_files": {str(p.relative_to(saved)): digest(p) for p in sorted(saved.rglob("*")) if p.is_file()},
        "smoke_fixture": digest(args.output_dir / "gelu-smoke.npz"),
        "tool_versions": {n: md.version(n) for n in ["tensorflow", "keras", "keras-hub", "tensorflowjs"]},
        "script": digest(Path(__file__)),
        "environment_lock": digest(Path(__file__).with_name("requirements.lock.txt")),
        "converter_command": command,
        "licensing": {"weights": "Apache-2.0 per pinned Keras model card (Small variant)",
                      "keras_hub": "Apache-2.0", "tensorflowjs": "Apache-2.0",
                      "provenance": "See source_files README.md immutable URL/hash; distribution attribution is completed in stage 6"},
        "scope": "Successful conversion and rewrite smoke only; no representative-image/TFJS runtime validation or app integration",
    }
    (args.output_dir / "conversion.json").write_text(json.dumps(report, indent=2) + "\n")
    print(f"PASS: {len(actual_shards)} shards, {report['graph_total_bytes']} graph bytes", flush=True)

if __name__ == "__main__":
    main()
