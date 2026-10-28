"""Package generated static output, with no network or third-party dependencies."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import tarfile
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
web = root / 'web-dist'
info = json.loads((web / 'build-info.json').read_text())
assert re.fullmatch(r'Alpha \d+\.\d+', info['version'])
version = info['version'].replace(' ', '_').replace('.', '_')
files = sorted(path for path in web.rglob('*') if path.is_file())
assert {path.relative_to(web).as_posix() for path in files} == {
    'index.html', 'manifest.webmanifest', 'sw.js', 'install/index.html',
    'install.js', 'install.css', 'icons/icon-192.png', 'icons/icon-512.png',
    'icons/maskable-512.png', '_headers', 'build-info.json',
}
assert hashlib.sha256((web / 'index.html').read_bytes()).hexdigest() == info['hostedGameSha256']
assert hashlib.sha256((root / 'dist/index.html').read_bytes()).hexdigest() == info['standaloneSha256']
for entry in info['cacheAssets']:
    path = 'index.html' if entry['url'] == './' else 'install/index.html' if entry['url'] == 'install/' else entry['url']
    assert hashlib.sha256((web / path).read_bytes()).hexdigest() == entry['sha256'], path
output = args.output.resolve()
assert not output.is_relative_to(web), 'Output must not be inside the deployed static directory'
output.mkdir(parents=True, exist_ok=True)
archive = output / f'Last_Stand_After_Dark_{version}_Hosted_Web.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as package:
    for path in files:
        package.write(path, path.relative_to(web).as_posix())
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    assert len(package.namelist()) == len(files)
    for path in files:
        assert package.read(path.relative_to(web).as_posix()) == path.read_bytes()
deployment = output / f'Last_Stand_After_Dark_{version}_Sites_Deployment.tar.gz'
with tarfile.open(deployment, 'w:gz') as package:
    package.add(root / '.openai/hosting.json', arcname='.openai/hosting.json', recursive=False)
    for path in files:
        package.add(path, arcname='web-dist/' + path.relative_to(web).as_posix(), recursive=False)
with tarfile.open(deployment, 'r:gz') as package:
    assert len(package.getnames()) == len(files) + 1
    for item in package.getmembers():
        assert item.isfile()
        assert package.extractfile(item).read() == (root / item.name).read_bytes()
sums = output / 'SHA256SUMS.txt'
sums.write_text(''.join(f'{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}\n' for path in [archive, deployment]))
print(json.dumps({'version': info['version'], 'build': info['build'], 'files': len(files), 'webZip': str(archive), 'sitesTar': str(deployment), 'published': False}))
