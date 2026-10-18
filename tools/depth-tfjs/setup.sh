#!/usr/bin/env bash
set -euo pipefail
tool_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
env_dir="${1:?Usage: bash tools/depth-tfjs/setup.sh /absolute/path/to/new-venv}"
python_bin="${DEPTH_PYTHON:-python3.12}"
if [[ -e "$env_dir" ]]; then
  echo "Refusing to mutate an existing environment: $env_dir" >&2
  exit 1
fi
"$python_bin" -c 'import sys; assert sys.version_info[:2] == (3, 12), "CPython 3.12 required"'
"$python_bin" -m venv "$env_dir"
"$env_dir/bin/python" -m pip install --disable-pip-version-check pip==25.0.1
"$env_dir/bin/python" -m pip install --disable-pip-version-check -r "$tool_dir/requirements.lock.txt"
KERAS_BACKEND=tensorflow CUDA_VISIBLE_DEVICES=-1 "$env_dir/bin/python" "$tool_dir/verify_environment.py"
