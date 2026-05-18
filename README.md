# Learning Machines Summer Camp '26 — Landing Page

A free 6-week summer camp for ambitious builders. July 20 – August 31, 2026.

Visual style is borrowed from [generalintelligencecompany.com](https://www.generalintelligencecompany.com/) — soft painterly background, floating glassmorphism nav pill, Fraunces serif headings, frosted-glass content cards, pixel-art park footer.

## File map

```
index.html         — main landing page
about.html         — /about
writing.html       — /writing
faq.html           — /faq
styles.css         — all styles
script.js          — FAQ accordion, time indicator, reveal-on-scroll, nav hide-on-scroll
vercel.json        — clean URLs (so /about works, not just /about.html)
PROMPTS.md         — image-generation prompts for the hero + footer art
```

## Design notes

- **Fonts:** Fraunces (display) + Inter (body), both Google Fonts.
- **Hero + footer images** are currently Unsplash placeholders. See `PROMPTS.md` for the AI-generation prompts to swap them out with custom Toronto park art in Studio Ghibli + pixel-art styles.
- **Apply links** all use `data-apply-link` so you can swap them in one find-and-replace once you have the Google Form / Fillout URL. Search `index.html` for `href="#apply"` and `href="#"` near `data-apply-link` and replace.

## Local preview

No build step. Open `index.html` in a browser. Or, with Python:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Note: with `python -m http.server`, the clean-URL rewrites in `vercel.json` won't be active locally — you'll need to use the `.html` extension (e.g. `localhost:8080/about.html`). On Vercel they'll work without the extension.

## Deploy to Vercel

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial landing page"
   gh repo create lm-summer-camp --public --source=. --push
   ```
2. Go to [vercel.com/new](https://vercel.com/new), import the repo. Framework preset: **Other**. No build command, no output directory. Vercel serves the root.
3. Click Deploy. Done.

The `vercel.json` file gives you clean URLs (`/about` instead of `/about.html`) and aggressive caching for static assets.

## Custom subdomain (e.g. `camp.learningmachines.xyz`)

1. In Vercel: **Settings → Domains → Add** → enter your subdomain.
2. Vercel gives you a CNAME record. Add it at your DNS provider:
   ```
   Type: CNAME
   Host: camp
   Value: cname.vercel-dns.com
   ```
3. Vercel auto-issues SSL within minutes.

## Things to wire up before launch

- **Apply form:** every `data-apply-link` `<a>` currently points to `#apply` (in-page) or `#`. Replace with your Google Form / Fillout URL.
- **Custom hero + footer images:** see `PROMPTS.md`. After generating, drop them in an `assets/` folder and update the two `background-image: url(...)` lines in `styles.css`.
- **Real applicant FAQ answers:** the current copy is reasonable defaults adapted from buildspace's FAQ, but should be reviewed and tightened by you.
- **Email address:** `hi@learningmachines.xyz` is the placeholder — change to whatever you actually monitor.
- **Cohort dates:** `July 20 — August 31, 2026` appears in a few places. Search the codebase to update.
- **Social handles:** the footer has X (Twitter) and Instagram icons pointing to `#`. Wire them up.

## Editing copy

All copy lives in the HTML files. The structure mirrors the page order, so it's quick to scan and edit. No CMS, no dependencies.

## Tone reference

Tone is "polished + warm" — proper sentence case for headings, casual but considered prose, minimal corporate fluff. The GI site is a useful tonal reference too.
