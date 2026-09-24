# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A static marketing/booking website for AirCare, a Christchurch heat pump cleaning company. Plain HTML, CSS and vanilla JavaScript — no package manager, no framework. There is one small build step: `tools/build.py` (standard-library Python, no dependencies) assembles the `.html` files at the repo root from sources in `src/`. The generated HTML is committed, so a fresh clone opens in a browser and the host needs no build command.

Key product decisions (from README.md):
- Multi-page site (not an SPA) to mirror a real business site.
- Appointment booking is not handled in-app — nav/footer/CTAs link out to `https://bookings.gettimely.com/AirCareHPC/bb/book`.
- Contact form is backend-free, designed to submit via Netlify Forms.

## Running / previewing locally

Open the HTML files directly in a browser, or serve the directory with any static file server, e.g.:

```
python3 -m http.server 8000
```

**If you changed anything under `src/`, run `python3 tools/build.py` first.** There are no lint or test commands in this repo.

## The root `.html` files are generated — do not edit them

Every `.html` at the repo root, and `sitemap.xml`, is written by `tools/build.py` from
`src/`. Editing one directly works until the next build and is then silently lost.

- **Page copy and page-specific markup** → `src/pages/<page>.html`
- **Nav, footer, quote form, head/SEO block, sticky CTA** → `src/partials/`
- **Phone number, booking URL, nav variants, to-be-confirmed values** → `src/site.vars`

Then run `python3 tools/build.py` and commit both the source and the regenerated HTML.

`python3 tools/build.py --check` rebuilds in memory and fails with a diff if anything at
the root is out of date. It runs in the pre-commit hook (enable once per clone with
`git config core.hooksPath tools/hooks`) and as the Netlify build command, so a stale
commit fails the deploy rather than shipping.

### Three constructs, and no more. Do not add a fourth.

1. `<!--@ ... @-->` front matter at the top of a page source. `key: value`, or
   `key: <<` … `<<` for a multi-line value.
2. `<!-- include: name.html -->` on a line by itself. Partials carry their own
   indentation, so an include contributes none.
3. `{{ key }}` — page scope over site scope. **Defined → the value, even if empty.
   Undefined → `<span class="placeholder">[KEY]</span>`**, which is how a
   to-be-confirmed value renders on the page.

There are no loops, no conditionals and no slots, deliberately — that constraint is why
the build is ~190 lines. If you need a conditional, add a second partial or a variable
group in `src/site.vars` (the three nav variants work this way). A value that must
disappear without leaving a blank line carries its own leading newline and is appended
to the end of the previous line; `nav_pm_item` is the worked example.

### When to share a block, and when not to

**Share a block only if every page using it emits the same *number* of repeated
children, and the per-page differences are a handful of scalar values. A difference may
be a leaf, never a shape.**

`commercial-personal-care.html` has three cards in the "why these load faster" section
where the other two verticals have four, so that section stays hand-authored in each
page source even though most of its lines are identical. Near-duplication is the right
outcome there; a partial with a hole for "maybe a fourth card" is not, because that is
the first crack through which a template language grows forever.

The ~230 inline SVGs are deliberately *not* de-duplicated. Nobody hand-edits an SVG
path, so there is no drift risk — it is diff noise, not a hazard.

## Architecture

### Pages
Nine pages: `index.html`, `services.html`, `about.html`, `contact.html`, `property-managers.html`, `commercial.html` and three commercial verticals (`commercial-clinical`, `commercial-hospitality`, `commercial-personal-care`). Each is a complete, self-contained HTML document — but it is generated; see above.

Each page sets the current year via an inline script at the bottom, which lives once in `src/partials/tail.html`: `document.getElementById('footer-year').textContent = new Date().getFullYear();`.

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

- `js/navigation.js` — mobile hamburger toggle and active-nav-link highlighting. Included on every page. The active-link match strips a trailing `.html` from both the path and the `href`, because the host serves `foo.html` at `/foo` — comparing them raw matches nothing but the home page on the live site, while still looking correct under `python3 -m http.server`.
- `js/prices.js` — single source of truth for displayed prices. Holds a `PRICES` object keyed by service, and on load fills in every element with a `data-price="<key>"` attribute. Included on `index.html` and `services.html`. **To change a displayed price, edit the `PRICES` object in `js/prices.js`, not the HTML** — price spans in HTML are empty (`<span data-price="deepClean"></span>`) and populated at runtime. This is the *runtime* sibling of `src/site.vars`, which is *build-time*: consumer prices go in `prices.js`, everything the build substitutes goes in `site.vars`. Do not add a value to the wrong one.
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

**Regulated claims — state the boundary positively.** AirCare cleans heat pumps and is
not a qualified certifier, so no page may say or imply that a service makes a property
compliant, that AirCare certifies or assesses anything, or that any outcome is
guaranteed. The way that limit is expressed changed in `dc93202`: **say what the service
does and what the record *does* count for, rather than listing what it is not.** Prefer
"a dated record of when each unit was cleaned and the condition we found it in, for your
file" over "this is not a Food Control Plan compliance document". Do not reintroduce
"what this is not" panels because an older revision of a page had one. The sentence to
watch is the positive one: the record must stay *our* maintenance record, never something
that "counts towards" a regulated standard.

**Modals/popups:** none exist in the codebase yet. If one is added, follow the same conventions above (BEM naming, design tokens, explicit transition properties, `role="dialog"`/`aria-modal="true"`/focus handling consistent with the `role="alert"` pattern already used for form errors in `js/forms.js`), and give it a z-index above `.site-header`'s `z-index: 100`.

### Adding a new page
Copy an existing file in `src/pages/` and edit its front matter. A page needs `out`,
`slug`, `sitemap`, `title`, `description`, `og_title`, `page_css`, `page_scripts`, and a
`use:` line naming its nav group (`nav.consumer`, `nav.commercial` or `nav.property`).
Add `css/pages/{name}.css` if it needs page-specific styles. Then add the page to the nav
by editing `src/partials/header.html` — **once**, for every page at the same time — and
run `python3 tools/build.py`. The canonical URL, Open Graph tags, breadcrumb and the
`sitemap.xml` entry are all derived from `slug`; do not write them by hand.
