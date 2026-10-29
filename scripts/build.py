#!/usr/bin/env python3
"""Package only public web assets. Never include native ledgers or local backups."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'web'
OUTPUT = ROOT / 'dist'
FILES = ['index.html', 'styles.css', 'core.mjs', 'db.mjs', 'app.mjs', 'symbols.mjs', 'category-ui.mjs', 'category-drag.mjs', 'sw.js', 'manifest.webmanifest', '_headers',
         'icons/icon.svg', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png']

def main():
    digest = hashlib.sha256()
    for name in FILES:
        digest.update(name.encode())
        digest.update((SOURCE / name).read_bytes())
    build_id = digest.hexdigest()[:12]
    # Every release uses distinct URLs, so waiting workers cannot mix old/new code.
    versioned = {name: re.sub(r'(\.[^.]+)$', f'.{build_id}\\1', name) for name in ['styles.css','core.mjs','db.mjs','app.mjs','symbols.mjs','category-ui.mjs','category-drag.mjs']}
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)
    for name in FILES:
        destination = OUTPUT / versioned.get(name, name)
        destination.parent.mkdir(parents=True, exist_ok=True)
        if name.endswith(('.html','.mjs','.js','.css','.webmanifest')):
            text = (SOURCE / name).read_text()
            for original, replacement in versioned.items():
                text = text.replace('./' + original, './' + replacement)
            destination.write_text(text.replace('__BUILD_ID__', build_id))
        else:
            shutil.copyfile(SOURCE / name, destination)
    manifest = json.loads((OUTPUT / 'manifest.webmanifest').read_text())
    for icon in manifest['icons']:
        assert (OUTPUT / icon['src']).is_file()
    archive = ROOT / 'shiguang-ledger-static.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as zipped:
        for path in sorted(OUTPUT.rglob('*')):
            if path.is_file():
                zipped.write(path, path.relative_to(OUTPUT))
    print(f'发布版本：{build_id}\n网页目录：{OUTPUT}\n上传文件包：{archive}')

if __name__ == '__main__':
    main()
