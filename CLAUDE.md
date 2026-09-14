# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A static marketing/booking website for AirCare, a Christchurch heat pump cleaning company. Plain HTML, CSS and vanilla JavaScript — no build tooling, no package manager, no framework. Every page is a hand-authored `.html` file loaded directly by the browser.

Key product decisions (from README.md):
- Multi-page site (not an SPA) to mirror a real business site.
- Appointment booking is not handled in-app — nav/footer/CTAs link out to `https://bookings.gettimely.com/AirCareHPC/bb/book`.
- Contact form is backend-free, designed to submit via Netlify Forms.

## Running / previewing locally

There is no dev server or build step. Open the HTML files directly in a browser, or serve the directory with any static file server, e.g.:

```
python3 -m http.server 8000
```

There are no lint, test, or build commands in this repo.

## Architecture

### Pages
Four top-level pages: `index.html`, `services.html`, `about.html`, `contact.html`. Each is a fully self-contained HTML document (own `<head>`, header, footer, and inline `<script>` at the bottom).

### Shared header/footer are NOT templated — copy-paste only
`_includes/nav-bar.html` and `_includes/footer.html` exist purely as reference source for the shared header and footer markup. There is no static site generator or build step that includes them — each page has that markup pasted directly into its `<body>`. Comments in the pages confirm this convention (e.g. `contact.html` has `HEADER — paste from _includes/header.html`, `index.html` has `Paste contents of _includes/footer.html here.`).

**When editing the nav bar or footer, update `_includes/nav-bar.html` or `_includes/footer.html` AND manually copy the change into all four page files** — index, services, about, contact. There is no mechanism that keeps them in sync automatically.

Each page also sets the current year via an inline script at the bottom: `document.getElementById('footer-year').textContent = new Date().getFullYear();`.

### CSS structure and load order
Stylesheets are linked in a specific cascade order in every page's `<head>` — preserve this order when adding new pages or stylesheets:

1. `css/variables.css` — all design tokens (colors, type scale, spacing scale, radii, shadows, transitions). Change values here, not in component files.
2. `css/global.css` — base/reset-level element styles.
3. `css/layout.css` — shared structural layout (header, footer, grid/section scaffolding).
4. `css/components.css` — shared reusable UI components (buttons, cards, nav, forms) used across multiple pages.
5. `css/pages/{page}.css` — page-specific overrides/additions, one file per page (`home.css`, `services.css`, `about.css`, `contact.css`).

Prefer adding shared styles to `global.css`/`layout.css`/`components.css` and only put truly page-specific rules in `css/pages/*.css`.

### JavaScript — one file per concern
Scripts are separated by feature, each an IIFE, and only included on the pages that need them:

- `js/navigation.js` — mobile hamburger toggle and active-nav-link highlighting (matches current filename against nav `href`s). Included on every page.
- `js/prices.js` — single source of truth for displayed prices. Holds a `PRICES` object keyed by service, and on load fills in every element with a `data-price="<key>"` attribute. Included on `index.html` and `services.html`. **To change a displayed price, edit the `PRICES` object in `js/prices.js`, not the HTML** — price spans in HTML are empty (`<span data-price="deepClean"></span>`) and populated at runtime.
- `js/forms.js` — contact form validation and submission for `contact.html` only. Validates required fields client-side, then POSTs URL-encoded form data to Netlify Forms (`fetch('/', ...)`). Netlify Forms only works on Netlify's infrastructure — locally, the real fetch path never runs because there's an early `showSuccess(); return;` at the top of `submitForm()` for local testing, with the real fetch code below it (currently dead code while that early return is in place). See the comment block at the top of the file for how to toggle between local-testing and real-submission behavior, and what markup Netlify Forms requires (`data-netlify="true"`, hidden `form-name` input, matching `name="contact"`).

### The shared container — everything measures from one column

`--max-width` (1200px) plus `--gutter` is the site's single content column, and the header, every `.section`, the trust bar, the home hero and the footer all sit on it. The pattern is always the same: **the gutter goes on the full-bleed outer element, the `max-width` on the inner one** — `.section` pads and `.section-inner` caps; `.site-header` pads and `.nav` caps; `.hero` pads and `.hero__inner` caps. Putting padding on the capped element itself insets it by an extra gutter and knocks it out of line with the rest of the page, which is exactly the bug the nav had. If you add a new full-bleed band, follow that outer-pads/inner-caps pairing so its content lands on the same vertical line.

Prose inside the column is capped again at `--measure` (62ch) so paragraphs stay readable at 1200px — use `.section-intro` for the standard lead paragraph under a section heading rather than styling one inline.

### Colour — the palette is sampled from the logo

`--color-brand-blue` (#27538E) and `--color-brand-orange` (#EE7326) are the literal pixel values from `images/logo.webp`; `--color-brand-sky` and its two light tints are the third brand colour. Do not introduce a new blue or orange — darker and lighter steps already exist (`--color-brand-blue-deep/-dark/-mid`, `--color-brand-orange-dark/-dim/-bg`). The neutral ground (`--color-bg`, `--color-bg-sunken`, `--color-border`) is cooled towards the brand blue rather than a warm grey, which is what keeps the orange the only warm note on the page.

**Icons are coloured by their container, not by the markup.** Every inline SVG in the HTML uses `stroke="currentColor"` / `fill="currentColor"`, and the wrapper (`.service-card__icon`, `.why-point__icon`, `.value-card__icon`, `.contact-detail__icon`, `.trust-item__icon`, `.form-success__icon`, `.hero__phone-icon`) sets `color`. Never hardcode a hex into an SVG attribute — it will survive a palette change and quietly go off-brand.

### Typography

Headings are Poppins (`--font-display`), body copy is DM Sans (`--font-body`); both load from the single `@import` at the top of `global.css`. Poppins is chosen to echo the geometric letterforms of the logo wordmark, so keep headings on it rather than reaching for the body face.

### Conventions to match on any new or changed code

**CSS naming — BEM-ish, hyphenated.** Classes follow `block__element` and `block--modifier` (e.g. `.service-card`, `.service-card__icon`, `.service-card--featured`, `.btn--primary`). Elements are always double-underscore off their block, modifiers are always double-hyphen off the block they modify (not the element) — e.g. `.services-card-header--featured`, not `.service-card__header--featured`-on-the-element-then-modified. Match existing block names when extending a component instead of inventing a new block.

**Never hardcode a design value — always use the token from `css/variables.css`.** Colors, font sizes/weights, spacing, radii, shadows, and transition durations must reference `var(--...)` tokens, not literal `px`/`hex` values. There are currently no hex literals outside `variables.css` and no `style=` attributes in the HTML — keep it that way. The narrow exceptions are values that are genuinely geometric rather than design tokens (an optical nudge like `margin-top: 7px` on a bullet, the `22px` hamburger bar) and the `rgba(255,255,255,…)` overlays used on dark grounds. If a new value doesn't fit an existing token, add one to `variables.css` rather than inlining it.

**Transitions:** always `transition: <property> var(--transition-fast|--transition-normal)`, never a bare duration. Use `--transition-fast` (0.15s) for color/small state changes (link/icon color, background swaps), `--transition-normal` (0.25s) for layout-affecting changes (transform, box-shadow, hover-lift on cards). List each animated property explicitly (comma-separated), don't use `transition: all`.

**Hover states:** interactive elements set `opacity: 0.85` on hover via the global `a:hover` rule; buttons instead override `opacity: 1` and apply a `translateY(-1px)` lift plus a darker/alternate background — follow the existing `.btn--*:hover` pairs in `global.css` as the template for any new button variant.

**HTML labeling/accessibility patterns to reuse:**
- Every `<ul>` used for layout (nav links, feature lists, footer columns) gets `role="list"` — needed because `list-style: none` strips list semantics in some screen readers.
- Purely decorative icons/SVGs get `aria-hidden="true"`.
- Top-level page `<section>` elements pair `aria-labelledby="<slug>-heading"` with a matching `id` on the section's heading element.
- Icon-only or ambiguous interactive controls (logo link, hamburger button) get an explicit `aria-label`; toggle controls also carry `aria-expanded` and `aria-controls`.
- Custom nav toggles report state via `aria-expanded`/`aria-current="page"` rather than a purely visual indicator (see `js/navigation.js`).

**Section/page structure:** new page sections should be built from the existing layout primitives in `layout.css` rather than new one-off wrappers — `<section class="section section--{white|soft|blue|sky}">` containing a `.section-inner` (or `.page-header` for the top-of-page banner), with `.grid-2`/`.grid-3` for column layouts. Only add page-specific rules in `css/pages/{page}.css` when nothing in `layout.css`/`components.css` already covers it.

**Modals/popups:** none exist in the codebase yet. If one is added, follow the same conventions above (BEM naming, design tokens, explicit transition properties, `role="dialog"`/`aria-modal="true"`/focus handling consistent with the `role="alert"` pattern already used for form errors in `js/forms.js`), and give it a z-index above `.site-header`'s `z-index: 100`.

### Adding a new page
Follow the pattern of an existing page: copy the `<head>` stylesheet block (same order as above, plus a new `css/pages/{name}.css` if it needs page-specific styles), paste in the current header/footer markup from `_includes/`, add `js/navigation.js` (and `js/prices.js` if it shows prices, `js/forms.js` if it has the contact form), and add the page to the nav links in both `_includes/nav-bar.html` and every page's pasted-in copy.
