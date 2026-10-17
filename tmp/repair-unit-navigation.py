from pathlib import Path
from collections import defaultdict
from urllib.parse import quote
import hashlib, html, json, os, re

root = Path(__file__).resolve().parents[1]
report = (root / 'output/unlinked-simulation-audit-2026-10-14.txt').read_text(encoding='utf-8')
manifest = json.loads((root / 'output/navigation-move-manifest.json').read_text())
mapping = {row['old']: row['new'] for row in manifest}
for row in manifest:
    assert hashlib.sha256((root / row['new']).read_bytes()).hexdigest() == row['sha256']

def href(source, target):
    return quote(os.path.relpath(target, source.parent).replace('\\', '/'), safe='/')

def title(path):
    source = path.read_text(encoding='utf-8-sig', errors='replace')
    match = re.search(r'<title\b[^>]*>(.*?)</title>', source, re.S | re.I)
    return html.unescape(re.sub(r'\s+', ' ', match.group(1))).strip() if match else path.stem.replace('-', ' ').title()

def write(path, source):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('\n'.join(line.rstrip() for line in source.splitlines()) + '\n', encoding='utf-8')

# Retain old HTML entry points as redirects for bookmarks. Assets live only in the new folder.
for old, new in mapping.items():
    if not old.endswith('.html'):
        continue
    source, target = root / old, root / new
    url = href(source, target)
    write(source, f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Activity moved</title><meta http-equiv="refresh" content="0; url={url}"></head>
<body><p><a href="{url}">Open activity in Unit 4</a></p>
<script>location.replace({json.dumps(url)} + location.search + location.hash);</script></body></html>''')

records = []
category = ''
for line in report.splitlines():
    if re.match(r'^[ABCD]\. ', line):
        category = line[0]
    if line.startswith(('problem-walkthoughs/', 'unit-ApplicationFiles/')):
        records.append((category, root / mapping.get(line, line)))

activity = defaultdict(list)
resources = defaultdict(list)
apps = defaultdict(list)
for category, path in records:
    rel = path.relative_to(root).as_posix()
    walkthrough = rel.startswith('problem-walkthoughs/')
    unit = re.search(r'/unit[ -]([1-6])/', rel).group(1)
    base = root / ('problem-walkthoughs' if walkthrough else 'unit-ApplicationFiles') / (f'unit {unit}' if walkthrough else f'unit-{unit}')
    if not walkthrough:
        (apps if category == 'B' else resources)[base].append(path)
        continue
    is_revised_activity = any(part in rel for part in [
        '/revised-assets/matching-', '/revised-assets/wave_pulse-periodic/', '/revised-assets/wave_simulation/',
        '/force-and-velocity/', '/plate-comparison/', '/fixes/charge-flow-practice',
        '/fixes/circuit-transfer-practice', '/generator-practice/'
    ])
    is_resource = any(part in rel for part in ['/tab-accordion-diagrams/', '/worked-processes/'])
    if category == 'A' or (category == 'C' and not is_resource) or is_revised_activity:
        activity[base].append(path)
    else:
        resources[base].append(path)

for base, paths in activity.items():
    index = base / 'index.html'
    source = index.read_text(encoding='utf-8')
    cards = []
    for path in paths:
        rel = path.relative_to(base).as_posix()
        label = 'Additional practice' if ('audit' in rel or 'fixes' in rel) else 'Walkthrough'
        cards.append(f'''        <article class="card">
          <div class="label">{label}</div>
          <h2>{html.escape(title(path))}</h2>
          <a class="open-btn" href="{href(index, path)}">Open walkthrough</a>
        </article>''')
    closing = '      </div>\n    </section>'
    assert closing in source
    source = source.replace(closing, '\n'.join(cards) + '\n' + closing, 1)
    count = len(re.findall(r'<article\b', source))
    source = re.sub(r'\d+ walkthroughs\. Choose an activity to begin\.', f'{count} walkthroughs. Choose an activity to begin.', source)
    write(index, source)

for base, paths in apps.items():
    index = base / 'index.html'
    source = index.read_text(encoding='utf-8')
    for path in paths:
        relative = path.relative_to(base).as_posix()
        folder = relative.split('/')[0]
        # Place direct simulation links on matching Unit 5/6 application cards.
        pattern = r'<article\b[^>]*>.*?</article>'
        attached = [False]
        def add_link(match):
            card = match.group()
            if f'href="{folder}/' in card and 'class="actions"' in card and not attached[0]:
                attached[0] = True
                return card.replace('<div class="actions">', f'<div class="actions">\n              <a class="primary" href="{href(index, path)}">Open simulation</a>', 1)
            return card
        source = re.sub(pattern, add_link, source, flags=re.S)
        if not attached[0]:
            resources[base].append(path)
    write(index, source)

# Supplementary files stay beside their source/assets; the resource index labels their purpose.
style = '''body{margin:0;padding:28px 18px;background:#eff6ff;color:#172b43;font:16px/1.6 system-ui,sans-serif}main{max-width:960px;margin:auto}section{background:white;border:1px solid #ccd9e7;border-radius:18px;padding:20px;margin:20px 0}li{margin:14px 0}a{color:#245b98}small{display:block;overflow-wrap:anywhere;color:#526176}a:focus-visible{outline:3px solid #245b98;outline-offset:3px}'''
for base, paths in resources.items():
    index = base / 'resources.html'
    groups = defaultdict(list)
    for path in paths:
        rel = path.relative_to(base).as_posix()
        if any(token in rel for token in ['archive/', '-before', 'backups']):
            section = 'Archived versions — reference only'
        elif any(token in rel for token in ['assessment', 'setup-instructions', 'buzz-assignment']):
            section = 'Assessment templates and setup materials'
        elif any(token in rel for token in ['audit', 'revision-summary', 'lab-report']):
            section = 'Review notes and lesson revisions'
        elif path.name == 'parachute-challenge.html':
            section = 'Source fragments — download for editing'
        elif 'unit-ApplicationFiles' in str(base):
            section = 'Additional simulations and alternate versions'
        else:
            section = 'Diagrams and worked examples'
        download = ' download' if 'Source fragments' in section else ''
        groups[section].append(f'<li><a href="{href(index, path)}"{download}>{html.escape(title(path))}</a><small>{html.escape(rel)}</small></li>')
    sections = '\n'.join(f'<section><h2>{html.escape(name)}</h2><ul>{"".join(items)}</ul></section>' for name, items in groups.items())
    unit = re.search(r'unit[ -]([1-6])$', str(base)).group(1)
    write(index, f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Unit {unit} resources and versions</title><style>{style}</style></head><body><main><a href="index.html">&larr; Back to Unit {unit}</a><h1>Unit {unit} resources and versions</h1><p>Supporting materials and alternate versions. Archived copies are kept for reference.</p>{sections}</main></body></html>''')
    menu = base / 'index.html'
    source = menu.read_text(encoding='utf-8')
    source = source.replace('</main>', '  <p style="margin:24px 0"><a href="resources.html">Resources, assessment materials, and alternate versions</a></p>\n  </main>', 1)
    write(menu, source)

# Keep counts accurate in the unit chooser and home page.
hub = root / 'problem-walkthoughs/index.html'
source = hub.read_text(encoding='utf-8')
total = 0
for unit in range(1, 7):
    count = len(re.findall(r'<article\b', (hub.parent / f'unit {unit}/index.html').read_text(encoding='utf-8')))
    total += count
    source = re.sub(rf'(<h2>Unit {unit}</h2>\s*<p>)\d+( walkthroughs)', rf'\g<1>{count}\2', source)
write(hub, source)
home = root / 'index.html'
source = re.sub(r'\d+ walkthroughs', f'{total} walkthroughs', home.read_text(encoding='utf-8'))
# Close the branch-map container that was left open in the existing home page.
source = re.sub(r'(<span class="branch-line" aria-hidden="true"></span>\s*)(</header>)', r'\1</div>\n    \2', source)
write(home, source)
print(f'Updated {total} walkthrough entries; restored {sum(len(v) for v in apps.values())} local application/alternate entries.')
print(f'Organized {sum(len(v) for v in resources.values())} supporting or alternate files across {len(resources)} resource pages.')
print(f'Verified all {len(manifest)} moved files by SHA-256; retained six old HTML entry points.')
