from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit, quote
from collections import deque
import hashlib, http.server, json, threading, urllib.request

root = Path(__file__).resolve().parents[1]
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if not value:
                continue
            navigation = (tag == 'a' and key == 'href') or (tag == 'iframe' and key == 'src') or key in ('data-sim-href', 'data-buzz-href')
            resource = (tag in ('script', 'img', 'source', 'audio', 'video') and key == 'src') or (tag == 'link' and key == 'href')
            if not (navigation or resource):
                continue
            parsed = urlsplit(value)
            if not parsed.scheme and not parsed.netloc and parsed.path and not any(token in value for token in ('${', '{{')):
                self.links.append((navigation, unquote(parsed.path)))

files = [root / 'index.html']
for directory in ('problem-walkthoughs', 'unit-ApplicationFiles'):
    files.extend((root / directory).rglob('*.html'))
edges, missing = {}, []
for path in files:
    parser = Links()
    parser.feed(path.read_text(encoding='utf-8-sig', errors='replace'))
    edges[path] = []
    for navigation, url in parser.links:
        target = (root / url.lstrip('/') if url.startswith('/') else path.parent / url).resolve()
        if target.is_dir():
            target /= 'index.html'
        if not target.exists():
            missing.append([path.relative_to(root).as_posix(), url])
        if navigation:
            edges[path].append(target)
seen, queue = set(), deque([root / 'index.html'])
while queue:
    path = queue.popleft()
    if path in seen:
        continue
    seen.add(path)
    queue.extend(edges.get(path, []))
manifest = json.loads((root / 'output/navigation-move-manifest.json').read_text())
redirects = {root / row['old'] for row in manifest if row['old'].endswith('.html')}
unreachable = [path.relative_to(root).as_posix() for path in files if path not in seen and path not in redirects]
for row in manifest:
    assert hashlib.sha256((root / row['new']).read_bytes()).hexdigest() == row['sha256'], row['new']
for unit in range(1, 7):
    text = (root / f'problem-walkthoughs/unit {unit}/index.html').read_text(encoding='utf-8')
    assert '<iframe' not in text and '<script' not in text
assert not unreachable, unreachable
assert not missing, missing

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(root), **kwargs)
    def log_message(self, *args):
        pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), QuietHandler)
threading.Thread(target=server.serve_forever, daemon=True).start()
client = urllib.request.build_opener(urllib.request.ProxyHandler({}))
checked = 0
try:
    # Verify every HTML file including legacy entry points over local HTTP.
    for path in files:
        url = f'http://127.0.0.1:{server.server_port}/' + quote(path.relative_to(root).as_posix(), safe='/')
        with client.open(url, timeout=5) as response:
            assert response.status == 200, url
            assert response.read() == path.read_bytes(), url
        checked += 1
finally:
    server.shutdown()
    server.server_close()
result = {'html_files': len(files), 'unreachable': unreachable, 'missing_local_references': missing,
          'legacy_redirects': len(redirects), 'moved_files_hash_verified': len(manifest), 'http_pages_checked': checked,
          'scope': 'Static local links, assets and data-sim-href/data-buzz-href. Remote URLs and simulation behavior not tested.'}
(root / 'output/navigation-validation.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, indent=2))
