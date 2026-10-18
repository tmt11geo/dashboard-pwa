#!/usr/bin/env python3
"""Verify exact stage-3 graph bytes and prepare resumable Git blob inventory."""
import argparse
import hashlib
import json
from pathlib import Path


def inventory(graph_dir, report):
    expected = report['graph_files']
    actual = {p.name for p in graph_dir.iterdir() if p.is_file()}
    if actual != set(expected):
        raise ValueError(f'File set mismatch: missing={set(expected)-actual}, extra={actual-set(expected)}')
    files = []
    for name in sorted(expected):
        data = (graph_dir / name).read_bytes()
        sha256 = hashlib.sha256(data).hexdigest()
        if len(data) != expected[name]['bytes'] or sha256 != expected[name]['sha256']:
            raise ValueError(f'Byte/hash mismatch: {name}')
        blob = hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()
        files.append(dict(name=name, bytes=len(data), sha256=sha256, git_blob_sha=blob))
    model = json.loads((graph_dir / 'model.json').read_text())
    paths = [p for group in model['weightsManifest'] for p in group['paths']]
    if len(paths) != 24 or len(set(paths)) != 24 or set(paths) != set(expected)-{'model.json'}:
        raise ValueError('Weight manifest must reference the exact 24 shards once each')
    widths = {'float32': 4, 'int32': 4, 'bool': 1, 'complex64': 8}
    declared = 0
    for group in model['weightsManifest']:
        for weight in group['weights']:
            if 'quantization' in weight:
                raise ValueError('Unvalidated quantization')
            count = 1
            for dim in weight['shape']:
                count *= dim
            declared += count * widths[weight['dtype']]
    shard_bytes = sum(f['bytes'] for f in files if f['name'] != 'model.json')
    if declared != shard_bytes or shard_bytes != report['manifest_weight_bytes']:
        raise ValueError('Declared weight byte total mismatch')
    return dict(stage='6A', status='PASS', source_revision=report['source_revision'],
                destination='models/depth-anything-v2-small-tfjs-fp32-224-v1',
                manifest_complete=True, manifest_weight_bytes=declared,
                total_bytes=sum(f['bytes'] for f in files), files=files,
                remote_assets_verified=False,
                scope='Local byte integrity and transfer inventory only; not hosted assets')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--graph-dir', type=Path, required=True)
    parser.add_argument('--report', type=Path, default=Path(__file__).parent/'evidence/conversion-run-2.json')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = inventory(args.graph_dir, json.loads(args.report.read_text()))
    args.output.write_text(json.dumps(result, indent=2)+'\n')
    print(json.dumps({k: v for k, v in result.items() if k != 'files'}))
