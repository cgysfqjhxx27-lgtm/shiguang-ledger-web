#!/usr/bin/env python3
"""Check the deployable bundle using only repository-owned static files."""
from pathlib import Path
import hashlib
import json
import re
import tempfile
import zipfile
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build', ROOT / 'scripts' / 'build.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)

with tempfile.TemporaryDirectory(prefix='ledger-build-check-') as directory:
    # Check reproducibility without altering the published dist folder.
    build.OUTPUT = Path(directory) / 'dist'
    # build.py places the archive alongside ROOT; redirect that too.
    build.ROOT = Path(directory)
    build.main()
    actual = ROOT / 'dist'
    generated = build.OUTPUT
    names = {p.relative_to(generated) for p in generated.rglob('*') if p.is_file()}
    assert names == {p.relative_to(actual) for p in actual.rglob('*') if p.is_file()}, 'dist files differ; rebuild'
    for name in names:
        assert (actual / name).read_bytes() == (generated / name).read_bytes(), f'stale file: {name}'
    manifest = json.loads((actual / 'manifest.webmanifest').read_text())
    assert manifest['id'] == './' and manifest['scope'] == './'
    for name in names:
        p = actual / name
        if p.suffix in {'.html', '.js', '.mjs', '.css', '.webmanifest'}:
            text = p.read_text()
            assert '__BUILD_ID__' not in text, f'unreplaced version in {name}'
            for target in re.findall(r'\./([A-Za-z0-9_./-]+\.(?:mjs|js|css|svg|png|webmanifest))', text):
                assert (actual / target).is_file(), f'missing asset: {target}'
    with zipfile.ZipFile(Path(directory) / 'shiguang-ledger-static.zip') as archive:
        assert set(archive.namelist()) == {str(p) for p in names}
        assert 'index.html' in archive.namelist()
    digest = hashlib.sha256(b''.join((actual / p).read_bytes() for p in sorted(names))).hexdigest()[:12]
    print(f'PASS: {len(names)} deployable files; relative paths and rebuilt output verified ({digest}).')
