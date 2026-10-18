"""Prepare byte-identical float32 inputs and source/rewrite references (stage 4)."""
import argparse
import json
from pathlib import Path
import shutil
from convert_model import digest, fetch_sources, make_backbone, rewrite_gelu


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source-dir', type=Path, required=True)
    p.add_argument('--conversion-dir', type=Path, required=True)
    p.add_argument('--output-dir', type=Path, required=True)
    args = p.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=False)
    import requests
    import tensorflow as tf
    import numpy as np
    import keras
    keras.utils.set_random_seed(1729)
    source = fetch_sources(args.source_dir)
    conversion = json.loads((args.conversion_dir / 'conversion.json').read_text())
    graph = args.conversion_dir / 'graph-model'
    for name, expected in conversion['graph_files'].items():
        if digest(graph / name) != expected:
            raise RuntimeError(f'Converted asset integrity failed: {name}')
    manifest = json.loads(Path(__file__).with_name('validation-fixtures.json').read_text())
    model = make_backbone(args.source_dir)
    references = []
    for f in manifest['fixtures']:
        r = requests.get(f['url'], timeout=(20, 60))
        r.raise_for_status()
        image = args.output_dir / f['name']
        image.write_bytes(r.content)
        if digest(image) != {k: f[k] for k in ('bytes', 'sha256')}:
            raise RuntimeError(f'Fixture integrity failed: {image}')
        rgb = tf.io.decode_jpeg(r.content, channels=3)
        x = tf.image.resize(tf.cast(rgb, tf.float32) / 255., [224, 224], method='bilinear', antialias=False)
        x = ((x - [.485, .456, .406]) / [.229, .224, .225])[None, ...]
        original = tf.nn.relu(model(x, training=False)).numpy()
        references.append((f, x.numpy(), original, list(rgb.shape)))
    rewrite_gelu(model)
    rows = []
    for f, x, original, shape in references:
        rewritten = tf.nn.relu(model(x, training=False)).numpy()
        if original.shape != (1, 224, 224, 1) or rewritten.shape != original.shape:
            raise RuntimeError('Unexpected reference output shape')
        if not np.isfinite(original).all() or not np.isfinite(rewritten).all():
            raise RuntimeError('Non-finite reference output')
        stem = Path(f['name']).stem
        files = {}
        for label, data in [('input', x), ('original', original), ('rewritten', rewritten)]:
            path = args.output_dir / f'{stem}-{label}.bin'
            np.asarray(data, dtype='<f4').tofile(path)
            files[label] = {'path': path.name, **digest(path)}
        error = np.abs(original - rewritten)
        span = float(np.ptp(original))
        if span <= 1e-6:
            raise RuntimeError('Degenerate source range')
        metrics = {'mae': float(error.mean()), 'max_abs_error': float(error.max()),
                   'mae_source_range': float(error.mean()) / span}
        if metrics['max_abs_error'] > 1e-3 or metrics['mae_source_range'] > 1e-4:
            raise RuntimeError(f'Rewrite tolerance exceeded: {metrics}')
        rows.append({'name': stem, 'jpeg_shape': shape, 'files': files,
                     'rewrite_vs_original': metrics, 'finite': True,
                     'output_shape': list(original.shape),
                     'source_range': [float(original.min()), float(original.max())]})
        print(f'Prepared {stem}', flush=True)
    # Served only on loopback; the browser receives the exact Python tensor bytes.
    shutil.copytree(graph, args.output_dir / 'graph-model')
    report = {'stage': 4, 'fixture_manifest': manifest, 'source_files': source,
              'conversion_report': digest(args.conversion_dir / 'conversion.json'),
              'model_files': conversion['graph_files'], 'fixtures': rows,
              'preprocessing': 'TF decode_jpeg RGB; /255; bilinear 224 square antialias=False; ImageNet mean/std; NHWC float32 little-endian',
              'versions': conversion['tool_versions'], 'script': digest(Path(__file__))}
    (args.output_dir / 'prepared.json').write_text(json.dumps(report, indent=2) + '\n')


if __name__ == '__main__':
    main()
