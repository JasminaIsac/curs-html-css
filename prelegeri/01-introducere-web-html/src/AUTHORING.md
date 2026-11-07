# Authoring format for lesson parts

Proiect: **Prelegerea 1 — Introducere în web și structura documentului HTML**.
După editarea `src/parts/*.html` sau `src/template.html`, rulează `.\build.ps1` (sau `./build.sh`).

Each part file (`src/parts/partN.html`) contains ONLY `<section class="lesson">` elements, one per lesson
section, in order. No `<html>`, `<head>`, `<body>`. The engine (`assets/app.js`) turns them into the page.
Language: Romanian, with correct diacritics (ă â î ș ț — comma-below ș/ț, not cedilla).
Pentru lecțiile HTML, deschide tab-ul HTML cu `data-tab="html"`.

## Section

```html
<section class="lesson" id="s4" data-num="4" data-title="Poziționarea elementelor">
  ...blocks in reading order...
</section>
```

`id` is `s<num>`. The engine renders the `<h2>` from `data-num` + `data-title` — do not write it yourself.

## Block 1 — Markdown prose

```html
<script type="text/markdown">
Paragraph with `inline code`, **bold**, *em*, [link](https://developer.mozilla.org/).

### 4.1. Valorile lui `position`

- list item
- list item

1. ordered item
2. ordered item

| Valoare | Comportament |
|---|---|
| `static` | flux normal |

> [!TIP] Callout text (also [!WARN] and [!INFO]). One paragraph.

```css
/* a STATIC code block (no live preview) — only for code that cannot run live */
```
</script>
```

Supported: `###` (subsection — becomes a TOC entry; start it with the lesson number, e.g. `### 4.1. ...`),
`####`, paragraphs, `-` lists, `1.` lists, pipe tables, callouts, fenced code (```css / ```html / ```text),
inline code/bold/em/links. Lines starting with `<` are passed through as raw HTML.
Script contents are raw text: never write the literal sequence `</script` inside one.

## Block 2 — Live demo (the core of the page)

```html
<div class="demo" data-title="Insignă pe card" data-desc="Încearcă: șterge position: relative de pe .card." data-height="240">
  <script type="text/css" data-hidden>
/* optional scaffolding applied BEFORE the visible CSS, never shown */
  </script>
  <script type="text/css">
.card { position: relative; }
.insigna { position: absolute; top: 8px; right: 8px; }
  </script>
  <script type="text/html">
<div class="card">
    <span class="insigna">Nou</span>
    <h3>Cană ceramică</h3>
</div>
  </script>
  <script type="application/json" data-knobs>
[{"label":"position (.card)","sel":".card","prop":"position","options":["relative","static"]}]
  </script>
</div>
```

Attributes on `.demo`:
- `data-title` (required, short), `data-desc` (optional one-liner, ideally an "Încearcă: ..." hint).
- `data-height` preview height in px (default 200). Size it so the result fits without scrolling unless scrolling is the point.
- `data-tab="html"` to open the HTML tab first (default: CSS).
- `data-layout="stack"` puts the preview under the editor at full width (use for wide results, grids, the final page). Default is side by side.
- `data-resizable` adds a drag handle to resize the preview width (use for media queries, auto-fit grids, container queries, clamp(), overflow/ellipsis).

Knobs (optional, `application/json` with `data-knobs`) — UI controls that rewrite a declaration in the visible CSS live:
- select: `{"label":"justify-content","sel":".bara","prop":"justify-content","options":["flex-start","center","space-between"]}`
- range:  `{"label":"gap","sel":".bara","prop":"gap","type":"range","min":0,"max":40,"step":1,"unit":"px"}`
`sel` must be EXACTLY the selector text before `{` of a rule in the visible CSS (first match is used), and
`prop` must already be declared inside that rule (its current value is the knob's starting value).
Use knobs where comparing values is the lesson (display, position, justify-content, align-items, flex-wrap,
object-fit, background-clip, overflow, transition timing functions, animation-fill-mode, etc.).

Hidden demo JS (rare; only if CSS alone cannot show the idea): `<script type="text/demo-js">...</script>`.
The engine already offers Reset, Copy and Replay (reload preview, restarts animations) buttons — do not build UI chrome.

Preview iframe base stylesheet (already applied, do not repeat):
```css
html { font: 15px/1.5 system-ui, sans-serif; color: #263238; background: #fff; }
body { margin: 0; padding: 16px; }
/* helpers you MAY use in demo HTML/CSS to keep snippets short: */
.b  { padding: 10px 14px; border-radius: 8px; background: var(--c, #1565c0); color: #fff; font-weight: 600; }
.b1 { --c: #1565c0; } .b2 { --c: #00897b; } .b3 { --c: #f4511e; } .b4 { --c: #8e24aa; } .b5 { --c: #f9a825; }
.frame { border: 2px dashed #b0bec5; border-radius: 10px; padding: 10px; }
.muted { color: #607d8b; }
```

## Rules for content

- Keep ALL the lesson's explanatory text and tables (it is the author's own material); you may tighten wording
  or add a sentence of explanation where it helps, but don't drop content.
- EVERY CSS/HTML snippet of the lesson becomes a live demo, showing the snippet's code (lightly completed so it
  renders something meaningful). Closely related one-liners may be merged into one demo (e.g. the four
  gradients side by side), or into one demo with a knob. Only code that truly cannot run in a sandbox
  (e.g. `@font-face` with a local file, `<link>` in `<head>`, `<meta viewport>`, `@media print`) stays a static
  fenced block — and even then add a demo if a nearby equivalent can be shown.
- No external images or network resources in demos. Replace `url("../Imagini/...")` with CSS gradients or
  inline SVG data URIs (keep a comment saying what the original was).
- Make demos look good: realistic Romanian content (shop products, menus, forms), the lesson's palette
  (#1565c0 blue, #263238 text, #607d8b muted, crimson/#c62828 for errors), rounded corners, enough spacing.
  Where a "before vs after" or "wrong vs right" comparison teaches better, show both side by side in one demo.
- Add good examples beyond the lesson where they clarify a concept (e.g. a z-index stacking-context trap,
  margin collapse visualised with labels), but keep the lesson's order.
- `data-desc` hints should invite a concrete experiment.
- Demo HTML is a fragment (goes inside `<body>`). Don't use `<!-- -->` comments in demo HTML.
- In-page anchors in demos (`href="#detalii"`) work: each preview is its own document.
