#!/usr/bin/env python3
"""Stage 6AC: audit a checked-out distribution; no URL or runtime checks."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'tools/depth-tfjs/evidence'

def audit():
    expected = json.loads((EVIDENCE / 'package-inventory.json').read_text())
    conversion = json.loads((EVIDENCE / 'conversion-run-2.json').read_text())
    licensing = json.loads((EVIDENCE / 'package-license-checkpoint.json').read_text())
    directory = ROOT / expected['destination']
    names = {f['name'] for f in expected['files']}
    notices = {'LICENSE.txt', 'SOURCE_MODEL_CARD.md', 'ATTRIBUTION.md'}
    assert {p.name for p in directory.iterdir()} == names | notices, 'Unexpected distribution contents'
    rows = []
    for item in expected['files']:
        data = (directory / item['name']).read_bytes()
        actual = dict(name=item['name'], bytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
                      git_blob_sha=hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest())
        assert actual == item, item['name']
        assert actual['sha256'] == conversion['graph_files'][item['name']]['sha256']
        tracked = subprocess.check_output(['git', 'rev-parse', f"HEAD:{expected['destination']}/{item['name']}"], cwd=ROOT, text=True).strip()
        assert tracked == actual['git_blob_sha'], 'Worktree differs from branch asset'
        rows.append(actual)
    model = json.loads((directory / 'model.json').read_text())
    paths = [p for group in model['weightsManifest'] for p in group['paths']]
    assert len(paths) == len(set(paths)) == 24
    assert set(paths) == names - {'model.json'}
    assert paths == [f'group1-shard{i}of24.bin' for i in range(1,25)]
    widths = {'float32':4, 'int32':4, 'bool':1, 'complex64':8}
    declared = 0
    for group in model['weightsManifest']:
        for weight in group['weights']:
            assert 'quantization' not in weight
            count = 1
            for dim in weight['shape']:
                count *= dim
            declared += count * widths[weight['dtype']]
    assert declared == expected['manifest_weight_bytes'] == 97145740
    assert sum(x['bytes'] for x in rows) == expected['total_bytes'] == 97817343
    notice_rows = []
    for name, key in [('LICENSE.txt','license'), ('SOURCE_MODEL_CARD.md','source_model_card')]:
        data = (directory/name).read_bytes()
        assert len(data) == licensing[key]['bytes']
        assert hashlib.sha256(data).hexdigest() == licensing[key]['sha256']
        notice_rows.append(dict(name=name, bytes=len(data), sha256=hashlib.sha256(data).hexdigest()))
    assert expected['source_revision'] == conversion['source_revision'] == licensing['source_model_card']['revision']
    tracked_paths = subprocess.check_output(['git','ls-tree','-r','--name-only','HEAD'],cwd=ROOT,text=True).splitlines()
    agents = [p for p in tracked_paths if Path(p).name == 'AGENTS.md']
    assert not agents, 'Review newly added repository instructions before proceeding'
    return dict(stage='6AC', status='PASS', branch='depth-tfjs-webgl',
        audited_commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
        scope='Checked-out branch bytes and distribution metadata; immutable URL checks are 6AD, runtime load is 6AE',
        source_revision=expected['source_revision'], destination=expected['destination'],
        files=rows, notices=notice_rows, manifest_shards=24, manifest_weight_bytes=declared,
        total_model_bytes=expected['total_bytes'], agents_files=agents, blockers=[],
        checks={'exact_distribution_file_set':True,'all_assets_match_inventory_and_conversion':True,
                'all_asset_blobs_match_HEAD':True,'manifest_relative_ordered_unique_complete':True,
                'unquantized_weight_byte_total':True,'pinned_license_and_model_card_unchanged':True})

if __name__ == '__main__':
    result = audit()
    (EVIDENCE/'package-audit.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k not in ('files','notices')}))
