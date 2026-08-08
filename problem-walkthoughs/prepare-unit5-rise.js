const fs = require('fs');
const path = require('path');

const root = __dirname;
const unitDirectory = path.join(root, 'unit 5');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const activeUnitFiveFiles = [...new Set(
  [...indexHtml.matchAll(/<a\b[^>]*class=["'][^"']*\bopen-btn\b[^"']*["'][^>]*href=["']([^"']+\.html)["']/gi)]
    .map((match) => decodeURIComponent(match[1]))
    .filter((relativeFile) => relativeFile.startsWith('unit 5/'))
)];

const riseStyles = `
  <style data-rise-unit-5>
    html,
    body {
      background: transparent;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 0;
      min-width: 0;
      padding: 12px;
    }

    .rise-walkthrough {
      width: min(100%, 1200px);
      max-width: 1200px;
      margin-inline: auto;
      border: 5px solid #285f9f;
      border-radius: 18px;
      overflow: hidden;
    }

    .rise-walkthrough.rise-shell {
      padding: clamp(12px, 2vw, 24px);
      background: #fff;
    }

    .rise-walkthrough .rise-title {
      max-width: 900px;
      margin: 0 auto 12px;
      font-size: clamp(1.25rem, 2.5vw, 1.8rem);
      line-height: 1.2;
    }

    .rise-walkthrough canvas,
    .rise-walkthrough svg {
      max-width: 100%;
    }

    .rise-walkthrough button,
    .rise-walkthrough input,
    .rise-walkthrough select {
      min-height: 32px;
    }

    .rise-walkthrough button:focus-visible,
    .rise-walkthrough input:focus-visible,
    .rise-walkthrough select:focus-visible {
      outline: 3px solid #f59e0b;
      outline-offset: 3px;
    }

    .rise-walkthrough > #canvas-container,
    .rise-walkthrough > .controls-panel {
      margin-inline: auto;
    }

    @media (max-width: 520px) {
      body { padding: 4px; }
      .rise-walkthrough { border-width: 5px; border-radius: 12px; }
      .rise-walkthrough.rise-shell { padding: 10px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .rise-walkthrough *,
      .rise-walkthrough *::before,
      .rise-walkthrough *::after {
        scroll-behavior: auto !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>`;

const tailwindFallbackStyles = `
  <style data-local-utility-styles>
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: minmax(0, 1fr); }
    .gap-6 { gap: 1.5rem; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .space-x-2 > * + * { margin-left: .5rem; }
    .bg-slate-100 { background: #f1f5f9; }
    .bg-white { background: #fff; }
    .p-4 { padding: 1rem; }
    .rounded { border-radius: .25rem; }
    .rounded-md { border-radius: .375rem; }
    .font-semibold { font-weight: 600; }
    .text-lg { font-size: 1.125rem; }
    .text-sm { font-size: .875rem; }
    .text-blue-600 { color: #2563eb; }
    .text-slate-600 { color: #475569; }
    .text-slate-800 { color: #1e293b; }
    .mb-1 { margin-bottom: .25rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mr-2 { margin-right: .5rem; }
    .mt-4 { margin-top: 1rem; }
    .h-4 { height: 1rem; min-height: 1rem; }
    .w-4 { width: 1rem; }
    .cursor-pointer { cursor: pointer; }
    .border-gray-300 { border-color: #d1d5db; }
    @media (min-width: 768px) {
      .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>`;

const completionScript = `
  <script data-rise-completion>
    (() => {
      let riseCompletionSent = false;
      const sendRiseCompletion = () => {
        if (riseCompletionSent) return;
        riseCompletionSent = true;
        window.parent.postMessage({ type: 'complete' }, '*');
      };

      const riseRoot = document.querySelector('.rise-walkthrough');
      if (!riseRoot) return;

      // Explorer completion: the learner changes one meaningful setting or starts a model.
      riseRoot.addEventListener('change', sendRiseCompletion);
      riseRoot.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        const label = (button.id + ' ' + button.textContent).toLowerCase();
        if (/reset|replay|pause/.test(label)) return;
        sendRiseCompletion();
      });
    })();
  </script>`;

function addClass(openingTag, className) {
  if (/\bclass=["']/i.test(openingTag)) {
    return openingTag.replace(/\bclass=(["'])(.*?)\1/i, (full, quote, classes) =>
      classes.split(/\s+/).includes(className)
        ? full
        : `class=${quote}${classes} ${className}${quote}`
    );
  }
  return openingTag.replace(/>$/, ` class="${className}">`);
}

function normalizeBody(html, title) {
  return html.replace(/<body([^>]*)>([\s\S]*?)<\/body>/i, (full, attributes, originalBody) => {
    let body = originalBody.trim();
    const mainMatch = body.match(/<main\b[^>]*>/i);

    if (!mainMatch) {
      body = `<main class="rise-walkthrough rise-shell" aria-label="${title.replace(/"/g, '&quot;')}">\n${body}\n</main>`;
    } else {
      body = body.replace(mainMatch[0], addClass(mainMatch[0], 'rise-walkthrough'));
      const closingMain = body.indexOf('</main>');
      if (closingMain < 0) throw new Error(`Missing </main> in ${title}`);
      const afterMain = body.slice(closingMain + '</main>'.length).trim();
      if (afterMain) {
        body = `${body.slice(0, closingMain)}\n${afterMain}\n</main>`;
      }
    }

    if (!body.includes("window.parent.postMessage({ type: 'complete' }, '*');")) {
      body = body.replace(/<\/main>\s*$/i, `${completionScript}\n</main>`);
    }

    if (!/<h1\b/i.test(body)) {
      if (/<h2\b/i.test(body)) {
        body = body.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/i, '<h1$1>$2</h1>');
      } else {
        body = body.replace(/(<main\b[^>]*>)/i, `$1\n<h1 class="rise-title">${title}</h1>`);
      }
    }

    return `<body${attributes}>\n${body}\n</body>`;
  });
}

function normalizeControls(html, title) {
  html = html.replace(/<button\b(?![^>]*\btype=)([^>]*)>/gi, '<button type="button"$1>');
  return html.replace(/<canvas\b([^>]*)>/gi, (canvasTag, attributes) => {
    if (/\baria-label(?:ledby)?=/i.test(attributes)) return canvasTag;
    const role = /\brole=/i.test(attributes) ? '' : ' role="img"';
    const label = title.replace(/"/g, '&quot;');
    return `<canvas${role} aria-label="Interactive visualization for ${label}"${attributes}>`;
  });
}

let updated = 0;
for (const relativeFile of activeUnitFiveFiles) {
  const sourceFile = path.join(root, ...relativeFile.split('/'));
  let html = fs.readFileSync(sourceFile, 'utf8');
  const whitespaceCleanedHtml = html.replace(/[ \t]+(?=\r?$)/gm, '');
  const whitespaceChanged = whitespaceCleanedHtml !== html;
  html = whitespaceCleanedHtml;

  const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || path.basename(sourceFile, '.html'))
    .replace(/<[^>]+>/g, '')
    .trim();
  const controlNormalizedHtml = normalizeControls(html, title);
  const controlsChanged = controlNormalizedHtml !== html;
  html = controlNormalizedHtml;

  const alreadyReady = /html\s*,\s*body\s*\{[^}]*background:\s*transparent/is.test(html)
    && html.includes("window.parent.postMessage({ type: 'complete' }, '*');")
    && /5px\s+solid\s+#285f9f/i.test(html)
    && /<h1\b/i.test(html)
    && !/(?:src|href)=["']https?:|@import\s+url\(["']?https?:/i.test(html)
    && !/<\/main>\s*<script/is.test(html);
  if (alreadyReady && !whitespaceChanged && !controlsChanged) continue;

  const usedTailwind = /<script\b[^>]*src=["']https:\/\/cdn\.tailwindcss\.com\/?["'][^>]*><\/script>/i.test(html);
  html = html.replace(/\s*<script\b[^>]*src=["']https:\/\/cdn\.tailwindcss\.com\/?["'][^>]*><\/script>\s*/gi, '\n');
  if (usedTailwind && !html.includes('data-local-utility-styles')) {
    html = html.replace(/<\/head>/i, `${tailwindFallbackStyles}\n</head>`);
  }

  if (!html.includes('data-rise-unit-5')) {
    html = html.replace(/<\/head>/i, `${riseStyles}\n</head>`);
  }
  if (!/<meta\s+name=["']viewport["']/i.test(html)) {
    html = html.replace(/<head>/i, '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1">');
  }

  html = normalizeBody(html, title);
  fs.writeFileSync(sourceFile, html);
  updated += 1;
}

console.log(`Prepared ${updated} active Unit 5 walkthroughs for Rise.`);
