#!/usr/bin/env python3
"""Verify immutable model URLs against the validated package inventory (6AD)."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parents[2]

def verify(item, base):
    url = base + '/' + item['name']
    req = urllib.request.Request(url, headers={'User-Agent':'dashboard-pwa-package-verifier/1','Accept-Encoding':'identity'})
    with urllib.request.urlopen(req, timeout=30) as response:
        # Bound response size and reject truncation, HTML, or pointer substitutes by hash.
        data = response.read(item['bytes'] + 1)
        row = dict(name=item['name'], url=url, final_url=response.geturl(),
                   http_status=response.status, content_type=response.headers.get('Content-Type'),
                   content_length=response.headers.get('Content-Length'), bytes=len(data),
                   sha256=hashlib.sha256(data).hexdigest(),
                   git_blob_sha=hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest())
    assert row['http_status'] == 200, row
    assert row['final_url'] == url, 'Unexpected URL redirect'
    for key in ('bytes','sha256','git_blob_sha'):
        assert row[key] == item[key], f"{item['name']}: {key} mismatch"
    if row['content_length'] is not None:
        assert int(row['content_length']) == item['bytes']
    if item['name'] == 'model.json':
        model = json.loads(data)
        paths = [p for group in model['weightsManifest'] for p in group['paths']]
        assert paths == [f'group1-shard{i}of24.bin' for i in range(1,25)]
        row['manifest_parse_and_relative_paths'] = 'PASS'
    row['status'] = 'PASS'
    print(f"PASS {item['name']}: {len(data)} bytes", flush=True)
    return row

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--commit', required=True)
    p.add_argument('--output', type=Path, default=ROOT/'tools/depth-tfjs/evidence/package-urls.json')
    args = p.parse_args()
    if not re.fullmatch('[0-9a-f]{40}', args.commit):
        p.error('An immutable full commit SHA is required')
    inventory = json.loads((ROOT/'tools/depth-tfjs/evidence/package-inventory.json').read_text())
    base = f"https://raw.githubusercontent.com/tmt11geo/dashboard-pwa/{args.commit}/{inventory['destination']}"
    with ThreadPoolExecutor(max_workers=4) as pool:
        rows = list(pool.map(lambda item: verify(item,base), inventory['files']))
    result = dict(stage='6AD', status='PASS', checked_at=datetime.now(timezone.utc).isoformat(),
                  branch='depth-tfjs-webgl', asset_commit=args.commit, immutable_base_url=base,
                  files=rows, verified_files=len(rows), total_bytes=sum(r['bytes'] for r in rows),
                  blockers=[], timeout_seconds=30, concurrent_downloads=4,
                  limitations=['Raw GitHub HTTP checks only; browser CORS and explicit WebGL GraphModel loading remain 6AE',
                               'Live custom-domain Pages and Access checks deferred to stage 9; no deployment performed'],
                  next_action='6AE only: actual complete GraphModel load with explicit WebGL and no silent CPU fallback')
    args.output.write_text(json.dumps(result,indent=2)+'\n')
    print(f"PASS {len(rows)} immutable URLs, {result['total_bytes']} bytes")

if __name__ == '__main__':
    main()
