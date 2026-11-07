# Authoring format for lesson parts

Proiect: **Prelegerea 2 — HTML semantic, tabele, formulare și media**.
După editarea `src/parts/*.html` sau `src/template.html`, rulează `.\build.ps1` (sau `./build.sh`).

Each part file (`src/parts/partN.html`) contains ONLY `<section class="lesson">` elements, one per lesson
section, in order. No `<html>`, `<head>`, `<body>`. The engine (`assets/app.js`) turns them into the page.
Language: Romanian, with correct diacritics (ă â î ș ț — comma-below ș/ț, not cedilla).
Pentru lecțiile HTML, deschide tab-ul HTML cu `data-tab="html"`.

Vezi formatul detaliat în `1-introducere-web-html/src/AUTHORING.md` sau `5-css-avansat/src/AUTHORING.md`.

Reguli suplimentare pentru această lecție:
- Demo-urile se concentrează pe **HTML** (`data-tab="html"`); CSS-ul de stilizare e de obicei în `data-hidden`.
- Fără resurse de rețea în demouri (`iframe` către site-uri externe, fișiere audio/video reale). Simulează media cu SVG / placeholder stilizat și arată markup-ul real.
- Nu scrie secvența literală `</script` în interiorul unui `<script type="...">`.
