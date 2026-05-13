# Rise Block Builders

A collection of static HTML tools for generating Articulate Rise 360 custom blocks. Everything runs in the browser — no server, no build step, no dependencies to install.

## Deploying to Netlify

1. Go to https://app.netlify.com/drop
2. Drag this whole folder (or a zip of it) onto the page
3. You'll get a URL like `something-name-123.netlify.app`
4. Rename the site in Site settings if you want something memorable

That's it. The site is static — any host works (GitHub Pages, Cloudflare Pages, Vercel, even just opening `index.html` from disk).

## File structure

```
rise-builders/
├── index.html        ← landing page (what visitors see first)
├── matching.html     ← drag-and-drop image matching builder
├── question.html     ← multiple-choice image question builder
├── _redirects        ← Netlify clean-URL config (optional)
└── README.md         ← this file
```

## Adding a new builder later

Two steps:

**1.** Drop the new builder's HTML file into this folder. Give it a short lowercase name, e.g. `sorting.html`.

**2.** Open `index.html` and find the comment that says:

```html
<!-- Placeholder slot for the next builder. -->
```

Replace the `<div class="builder builder-placeholder">...</div>` block with a real link. The easiest way is to copy one of the two existing `<a class="builder">` blocks and edit four things:

- `href="sorting.html"` (or whatever you named the file)
- The `<h3 class="builder-title">` text
- The `<p class="builder-desc">` text
- The three `<span class="spec">` tags

If you want the placeholder card to keep showing below the real tools, leave it in place and just add the new `<a>` above it.

## How learners actually use the output

Each builder produces a zip named something like `rise-matching-package.zip`. That zip contains `index.html` + an `assets/` folder. **Rise wants the contents re-zipped**, not the download as-is:

1. Extract the downloaded zip
2. Select `index.html` + `assets/` together
3. Compress those two things into a new zip
4. Upload that new zip into a Rise custom block

This quirk is Rise's convention, not something I can change from inside the builder.

## Fonts and assets

The landing page uses Fraunces (serif display) and JetBrains Mono (mono) from Google Fonts. The two builder pages use Tailwind via CDN. All three pages need internet access the first time they load — after that browsers cache everything.

## Privacy

All image uploads and ZIP generation happen client-side. Nothing is transmitted anywhere. If you open the browser's network tab while using a builder, you'll see requests only for the CDN fonts/scripts — no uploads.
