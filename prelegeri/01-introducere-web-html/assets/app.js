/* CSS avansat — motorul documentației interactive.
   Transformă <section class="lesson"> (markdown + .demo) în pagină cu editoare și previzualizări live. */
(() => {
    "use strict";

    /* ============ Utilitare ============ */
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const span = (cls, s) => `<span class="t-${cls}">${esc(s)}</span>`;
    const fold = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const store = {
        get(k) { try { return localStorage.getItem(k); } catch { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch { /* stocare indisponibilă */ } },
    };

    function dedent(text) {
        const lines = text.replace(/\t/g, "    ").replace(/^\s*\n/, "").replace(/\s+$/, "").split("\n");
        const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
        const min = indents.length ? Math.min(...indents) : 0;
        return lines.map((l) => l.slice(min)).join("\n");
    }

    const ICON = {
        copy: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="5" width="9" height="9" rx="2"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg>',
        reset: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4"/><path d="M2 2.5V5h2.5"/></svg>',
        replay: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 2.5v11l9-5.5z"/></svg>',
        open: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 2h5v5M14 2 7 9M12 9.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3.5"/></svg>',
    };

    /* ============ Evidențiere sintaxă ============ */
    function hlValue(s) {
        const re = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(!important)|(#[0-9a-fA-F]{3,8}\b)|(-?(?:\d+\.?\d*|\.\d+)(?:%|[a-zA-Z]+)?)|([(),\/])|(\s+)|([^\s(),\/"'!#]+|.)/g;
        let out = "", m;
        while ((m = re.exec(s))) {
            if (m[1]) out += span("str", m[1]);
            else if (m[2]) out += span("imp", m[2]);
            else if (m[3]) out += span("num", m[3]);
            else if (m[4]) out += span("num", m[4]);
            else if (m[5]) out += span("punc", m[5]);
            else if (m[6]) out += m[6];
            else out += span("val", m[7]);
        }
        return out;
    }

    function hlDecl(chunk) {
        const c = chunk.indexOf(":");
        if (c < 0) return span("sel", chunk);
        return span("prop", chunk.slice(0, c)) + span("punc", ":") + hlValue(chunk.slice(c + 1));
    }

    function hlCSS(s) {
        let out = "", i = 0;
        const n = s.length;
        while (i < n) {
            if (s.startsWith("/*", i)) {
                let j = s.indexOf("*/", i + 2);
                j = j < 0 ? n : j + 2;
                out += span("com", s.slice(i, j));
                i = j;
                continue;
            }
            const ch = s[i];
            if (/\s/.test(ch)) {
                let j = i;
                while (j < n && /\s/.test(s[j])) j++;
                out += s.slice(i, j);
                i = j;
                continue;
            }
            if (ch === "{" || ch === "}" || ch === ";") {
                out += span("punc", ch);
                i++;
                continue;
            }
            let j = i, paren = 0, quote = null;
            while (j < n) {
                const c = s[j];
                if (quote) {
                    if (c === "\\") { j += 2; continue; }
                    if (c === quote) quote = null;
                    j++;
                    continue;
                }
                if (c === '"' || c === "'") { quote = c; j++; continue; }
                if (c === "(") paren++;
                else if (c === ")") paren--;
                else if (paren <= 0 && (c === "{" || c === "}" || c === ";")) break;
                else if (s.startsWith("/*", j)) break;
                j++;
            }
            const chunk = s.slice(i, j);
            const trail = chunk.match(/\s*$/)[0];
            const body = chunk.slice(0, chunk.length - trail.length);
            if (body.startsWith("@")) {
                const kw = body.match(/^@[\w-]+/)[0];
                out += span("at", kw) + hlValue(body.slice(kw.length));
            } else if (s[j] === "{") {
                out += span("sel", body);
            } else {
                out += hlDecl(body);
            }
            out += trail;
            i = j;
        }
        return out;
    }

    function hlHTML(s) {
        let out = "", i = 0;
        const n = s.length;
        while (i < n) {
            const lt = s.indexOf("<", i);
            if (lt < 0) { out += esc(s.slice(i)); break; }
            out += esc(s.slice(i, lt));
            if (s.startsWith("<!--", lt)) {
                let j = s.indexOf("-->", lt);
                j = j < 0 ? n : j + 3;
                out += span("com", s.slice(lt, j));
                i = j;
                continue;
            }
            const tag = s.slice(lt).match(/^<\/?[a-zA-Z!][\w-]*/);
            if (!tag) { out += esc("<"); i = lt + 1; continue; }
            out += span("tag", tag[0]);
            i = lt + tag[0].length;
            const re = /\s+|\/?>|=|"[^"]*"|'[^']*'|[^\s=>\/"']+|./gy;
            re.lastIndex = i;
            let m;
            while ((m = re.exec(s))) {
                const t = m[0];
                i = re.lastIndex;
                if (t === ">" || t === "/>") { out += span("tag", t); break; }
                if (/^\s+$/.test(t)) out += t;
                else if (t === "=") out += span("punc", t);
                else if (t[0] === '"' || t[0] === "'") out += span("str", t);
                else out += span("attr", t);
            }
            if (!m) i = n;
        }
        // conținutul <style> din HTML primește evidențiere CSS
        return out;
    }

    function hlJS(s) {
        const re = /(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(const|let|var|function|return|if|else|for|of|in|new|class|this|document|window|true|false|null|addEventListener)\b|(\b\d+\.?\d*\b)|([\s\S])/g;
        let out = "", m;
        while ((m = re.exec(s))) {
            if (m[1]) out += span("com", m[1]);
            else if (m[2]) out += span("str", m[2]);
            else if (m[3]) out += span("at", m[3]);
            else if (m[4]) out += span("num", m[4]);
            else out += esc(m[5]);
        }
        return out;
    }

    const highlight = (code, lang) =>
        lang === "css" ? hlCSS(code) : lang === "html" ? hlHTML(code) : lang === "js" ? hlJS(code) : esc(code);

    /* ============ Markdown minimal ============ */
    function inline(text) {
        const codes = [];
        let s = text.replace(/`([^`]+)`/g, (_, c) => {
            codes.push(`<code>${esc(c)}</code>`);
            return `\u0000${codes.length - 1}\u0000`;
        });
        s = esc(s)
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
            .replace(/(^|[^\w*])\*([^*\s][^*]*?)\*(?![\w*])/g, "$1<em>$2</em>")
            .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
                const ext = /^https?:/.test(u);
                return `<a href="${u}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${t}</a>`;
            });
        return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[i]);
    }

    function splitRow(line) {
        const cells = [];
        let cur = "", inCode = false;
        const body = line.trim().replace(/^\|/, "").replace(/\|$/, "");
        for (let i = 0; i < body.length; i++) {
            const c = body[i];
            if (c === "`") inCode = !inCode;
            if (c === "\\" && body[i + 1] === "|") { cur += "|"; i++; continue; }
            if (c === "|" && !inCode) { cells.push(cur.trim()); cur = ""; continue; }
            cur += c;
        }
        cells.push(cur.trim());
        return cells;
    }

    function codeBlock(code, lang) {
        const wrap = document.createElement("div");
        wrap.className = "code";
        wrap.innerHTML = `<div class="code-head"><span class="lang">${esc(lang || "")}</span></div><pre><code class="hl">${highlight(code, lang)}</code></pre>`;
        const btn = toolButton("copy", "Copiază", () => copyText(code, btn));
        wrap.firstElementChild.append(btn);
        // anulăm stilul de <code> inline pentru blocuri
        wrap.querySelector("code").style.cssText = "all: unset; font: inherit;";
        return wrap;
    }

    function renderMarkdown(src) {
        const root = document.createElement("div");
        root.className = "prose";
        const lines = dedent(src).split("\n");
        let i = 0, html = "";
        const flush = () => {
            if (html) { root.insertAdjacentHTML("beforeend", html); html = ""; }
        };

        while (i < lines.length) {
            const line = lines[i];
            if (!line.trim()) { i++; continue; }

            const fence = line.match(/^```\s*([\w-]*)/);
            if (fence) {
                const buf = [];
                i++;
                while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
                i++;
                flush();
                root.append(codeBlock(buf.join("\n"), fence[1] || "text"));
                continue;
            }

            const h = line.match(/^(#{3,4})\s+(.*)$/);
            if (h) {
                html += h[1].length === 3 ? `<h3>${inline(h[2])}</h3>` : `<h4>${inline(h[2])}</h4>`;
                i++;
                continue;
            }

            if (/^\|/.test(line) && lines[i + 1] && /^\|?\s*:?-{2,}/.test(lines[i + 1])) {
                const head = splitRow(line);
                i += 2;
                const rows = [];
                while (i < lines.length && /^\|/.test(lines[i])) rows.push(splitRow(lines[i++]));
                html += `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows
                    .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
                    .join("")}</tbody></table></div>`;
                continue;
            }

            if (/^>/.test(line)) {
                const buf = [];
                while (i < lines.length && /^>/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
                let text = buf.join(" ");
                let kind = "info";
                const k = text.match(/^\[!(TIP|WARN|INFO|NOTE)\]\s*/i);
                if (k) {
                    kind = { tip: "tip", warn: "warn" }[k[1].toLowerCase()] || "info";
                    text = text.slice(k[0].length);
                }
                html += `<div class="callout ${kind}"><div><p>${inline(text)}</p></div></div>`;
                continue;
            }

            const li = line.match(/^(\s*)([-*]|\d+\.)\s+/);
            if (li) {
                const ordered = /\d/.test(li[2]);
                const start = ordered ? parseInt(li[2], 10) : 1;
                const items = [];
                while (i < lines.length) {
                    const m = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
                    if (m) { items.push(m[3]); i++; continue; }
                    if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) {
                        items[items.length - 1] += " " + lines[i].trim();
                        i++;
                        continue;
                    }
                    break;
                }
                const tag = ordered ? "ol" : "ul";
                html += `<${tag}${ordered && start !== 1 ? ` start="${start}"` : ""}>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</${tag}>`;
                continue;
            }

            if (/^\s*</.test(line)) {
                const buf = [];
                while (i < lines.length && lines[i].trim()) buf.push(lines[i++]);
                html += buf.join("\n");
                continue;
            }

            const buf = [];
            while (
                i < lines.length && lines[i].trim() &&
                !/^(#{3,4}\s|```|>|\||\s*([-*]|\d+\.)\s)/.test(lines[i])
            ) buf.push(lines[i++].trim());
            html += `<p>${inline(buf.join(" "))}</p>`;
        }
        flush();
        return root;
    }

    /* ============ Butoane și copiere ============ */
    function toolButton(icon, label, onClick, cls = "tool") {
        const b = document.createElement("button");
        b.type = "button";
        b.className = cls;
        b.innerHTML = `${ICON[icon] || ""}<span>${label}</span>`;
        b.addEventListener("click", onClick);
        return b;
    }

    async function copyText(text, btn) {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.cssText = "position:fixed;opacity:0";
            document.body.append(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
        }
        const label = btn.querySelector("span");
        const old = label.textContent;
        label.textContent = "Copiat";
        btn.classList.add("done");
        setTimeout(() => { label.textContent = old; btn.classList.remove("done"); }, 1300);
    }

    /* ============ Documentul din previzualizare ============ */
    const BASE_CSS = `
html { font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #263238; background: #fff; }
body { margin: 0; padding: 16px; }
.b  { padding: 10px 14px; border-radius: 8px; background: var(--c, #1565c0); color: #fff; font-weight: 600; }
.b1 { --c: #1565c0; } .b2 { --c: #00897b; } .b3 { --c: #f4511e; } .b4 { --c: #8e24aa; } .b5 { --c: #f9a825; }
.frame { border: 2px dashed #b0bec5; border-radius: 10px; padding: 10px; }
.muted { color: #607d8b; }`;

    // ascultă actualizări de CSS fără reîncărcare (postMessage funcționează și din file://)
    // și raportează înălțimea conținutului, ca previzualizarea să crească dacă e nevoie
    const BRIDGE = (id) => `addEventListener("message", function (e) {
  var d = e.data;
  if (d && d.__demo === "css") document.getElementById("__user").textContent = d.css;
});
(function () {
  var last = 0;
  function report() {
    var h = document.documentElement.scrollHeight;
    if (Math.abs(h - last) > 2) { last = h; parent.postMessage({ __demoHeight: ${id}, h: h }, "*"); }
  }
  addEventListener("load", report);
  if (window.ResizeObserver) new ResizeObserver(report).observe(document.body);
})();`;

    function buildDoc(d) {
        const safe = (s) => s.replace(/<\/(script|style)/gi, "<\\/$1");
        return `<!doctype html><html lang="ro"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${BASE_CSS}</style><style>${safe(d.hiddenCss)}</style><style id="__user">${safe(d.css)}</style>
</head><body>
${d.html}
<script>${BRIDGE(d.id)}<\/script>${d.js ? `<script>${safe(d.js)}<\/script>` : ""}
</body></html>`;
    }

    /* ============ Knobs: rescriu o declarație din CSS ============ */
    function findDecl(css, sel, prop) {
        const want = sel.replace(/\s+/g, " ").trim();
        const clean = css.replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length));
        let start = 0;
        for (let k = 0; k < clean.length; k++) {
            const c = clean[k];
            if (c === "}" || c === ";") start = k + 1;
            else if (c === "{") {
                const selText = clean.slice(start, k).replace(/\s+/g, " ").trim();
                let depth = 1, e = k + 1;
                while (e < clean.length && depth) {
                    if (clean[e] === "{") depth++;
                    else if (clean[e] === "}") depth--;
                    e++;
                }
                if (selText === want) {
                    const body = clean.slice(k + 1, e - 1);
                    const re = new RegExp(`(^|[\\s;{])(${prop.replace(/[-]/g, "\\-")})\\s*:\\s*([^;}]*?)\\s*(?=;|}|$)`, "m");
                    const m = re.exec(body);
                    if (m) {
                        const valStart = k + 1 + m.index + m[0].length - m[3].length;
                        return { start: valStart, end: valStart + m[3].length, value: m[3] };
                    }
                }
                start = k + 1;
            }
        }
        return null;
    }

    /* ============ Componenta demo ============ */
    let demoCount = 0;
    const heights = new Map();
    addEventListener("message", (e) => {
        const d = e.data;
        if (d && d.__demoHeight) heights.get(d.__demoHeight)?.(d.h);
    });
    const lazy = "IntersectionObserver" in window
        ? new IntersectionObserver((entries) => {
            for (const en of entries) {
                if (en.isIntersecting) {
                    lazy.unobserve(en.target);
                    en.target.__mount();
                }
            }
        }, { rootMargin: "700px 0px" })
        : null;

    function createDemo(el) {
        const id = ++demoCount;
        const pick = (sel) => el.querySelector(sel);
        const visCss = $$('script[type="text/css"]:not([data-hidden])', el).map((s) => dedent(s.textContent)).join("\n\n");
        const hidCss = $$('script[type="text/css"][data-hidden]', el).map((s) => s.textContent).join("\n");
        const html = pick('script[type="text/html"]') ? dedent(pick('script[type="text/html"]').textContent) : "";
        const js = $$('script[type="text/demo-js"]', el).map((s) => s.textContent).join("\n");
        let knobs = [];
        const kn = pick("script[data-knobs]");
        if (kn) {
            try { knobs = JSON.parse(kn.textContent); } catch (err) { console.warn("Knobs JSON invalid", el.dataset.title, err); }
        }

        const original = { css: visCss, html };
        const state = { id, css: visCss, html, hiddenCss: hidCss, js };
        const tabs = [];
        if (visCss || !html) tabs.push("css");
        if (html) tabs.push("html");
        if (el.dataset.tab === "html" && tabs.includes("html")) tabs.reverse();
        let active = tabs[0];

        const card = document.createElement("figure");
        card.className = "demo-card";
        card.id = el.id || `demo-${id}`;
        card.dataset.title = el.dataset.title || "";
        if (el.dataset.layout === "stack") card.classList.add("stack");
        const resizable = el.hasAttribute("data-resizable");
        if (resizable) card.classList.add("resizable");
        const height = parseInt(el.dataset.height, 10) || 200;

        card.innerHTML = `
<figcaption class="demo-head">
  <span class="demo-badge">Live</span>
  <h4 class="demo-title">${inline(el.dataset.title || "Exemplu")}</h4>
  ${el.dataset.desc ? `<p class="demo-desc">${inline(el.dataset.desc)}</p>` : ""}
</figcaption>
<div class="demo-body">
  <div class="editor-pane">
    <div class="tabs" role="tablist">
      ${tabs.map((t) => `<button type="button" class="tab" role="tab" data-t="${t}" aria-selected="${t === active}">${t.toUpperCase()}</button>`).join("")}
      <div class="tools"></div>
    </div>
    <div class="editor"><div class="ed-wrap"><pre aria-hidden="true"></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Cod editabil"></textarea></div></div>
  </div>
  <div class="preview-pane">
    <div class="preview-bar">
      <span class="dots"><i></i><i></i><i></i></span><span class="label">Rezultat</span>
      <span class="w"></span>
    </div>
    <div class="stage"><div class="frame-box"><iframe title="Rezultat: ${esc(el.dataset.title || "exemplu")}" loading="lazy"></iframe>${resizable ? '<span class="grip" role="separator" aria-label="Trage pentru a schimba lățimea" tabindex="0"></span>' : ""}</div></div>
  </div>
</div>`;

        const ta = $("textarea", card);
        const pre = $("pre", card);
        const iframe = $("iframe", card);
        const frameBox = $(".frame-box", card);
        const wLabel = $(".w", card);
        iframe.style.height = `${height}px`;
        // demo-urile cu derulare intenționată (sticky/fixed) sau cu unități vh își păstrează înălțimea
        const autoGrow = !el.hasAttribute("data-fixed-height") && !/position:\s*(sticky|fixed)|\d(d|s|l)?vh\b/.test(visCss + hidCss);
        if (autoGrow) heights.set(id, (h) => { iframe.style.height = `${Math.max(height, Math.min(h, 1400))}px`; });

        /* -- randare editor -- */
        const paint = () => { pre.innerHTML = highlight(state[active], active) + "\n"; };
        const showTab = (t) => {
            active = t;
            $$(".tab", card).forEach((b) => b.setAttribute("aria-selected", b.dataset.t === t));
            ta.value = state[t];
            paint();
            knobsEl && (knobsEl.hidden = t !== "css");
        };
        $$(".tab", card).forEach((b) => b.addEventListener("click", () => showTab(b.dataset.t)));

        /* -- previzualizare -- */
        let url = null, mounted = false;
        const reload = () => {
            if (url) URL.revokeObjectURL(url);
            url = URL.createObjectURL(new Blob([buildDoc(state)], { type: "text/html" }));
            iframe.src = url;
        };
        const pushCss = () => {
            if (!mounted) return;
            iframe.contentWindow && iframe.contentWindow.postMessage({ __demo: "css", css: state.css }, "*");
        };
        card.__mount = () => { if (!mounted) { mounted = true; reload(); } };

        let timer;
        ta.addEventListener("input", () => {
            state[active] = ta.value;
            paint();
            clearTimeout(timer);
            if (active === "css") { pushCss(); syncKnobs(); }
            else timer = setTimeout(reload, 350);
        });
        ta.addEventListener("keydown", (e) => {
            if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                document.execCommand("insertText", false, "    ");
            } else if (e.key === "Escape") {
                ta.blur();
            }
        });

        /* -- unelte -- */
        const tools = $(".tools", card);
        tools.append(
            toolButton("copy", "Copiază", function () { copyText(state[active], this); }),
            toolButton("reset", "Resetează", () => {
                state.css = original.css;
                state.html = original.html;
                showTab(active);
                syncKnobs();
                reload();
            }),
        );
        const bar = $(".preview-bar", card);
        bar.append(
            toolButton("replay", "Rulează", reload),
            toolButton("open", "Tab nou", () => {
                const u = URL.createObjectURL(new Blob([buildDoc(state)], { type: "text/html" }));
                window.open(u, "_blank", "noopener");
                setTimeout(() => URL.revokeObjectURL(u), 60000);
            }),
        );

        /* -- knobs -- */
        let knobsEl = null;
        const knobInputs = [];
        if (knobs.length) {
            knobsEl = document.createElement("div");
            knobsEl.className = "knobs";
            knobs.forEach((k) => {
                const wrap = document.createElement("label");
                wrap.className = "knob";
                wrap.innerHTML = `<span>${esc(k.label || k.prop)}</span>`;
                const apply = (val) => {
                    const hit = findDecl(state.css, k.sel, k.prop);
                    if (!hit) { console.warn("Knob fără țintă:", k); return; }
                    state.css = state.css.slice(0, hit.start) + val + state.css.slice(hit.end);
                    if (active === "css") {
                        const pos = ta.selectionStart;
                        ta.value = state.css;
                        ta.selectionStart = ta.selectionEnd = pos;
                        paint();
                    }
                    pushCss();
                    syncKnobs();
                };
                let ctl;
                if (k.type === "range") {
                    const unit = k.unit || "";
                    ctl = { set: null };
                    const r = document.createElement("input");
                    r.type = "range";
                    r.min = k.min ?? 0; r.max = k.max ?? 100; r.step = k.step ?? 1;
                    const out = document.createElement("output");
                    r.addEventListener("input", () => apply(r.value + unit));
                    wrap.append(r, out);
                    ctl.set = (v) => { const n = parseFloat(v); if (!isNaN(n)) r.value = n; out.textContent = v; };
                } else {
                    const opts = k.options || [];
                    const short = opts.length <= 4 && opts.join("").length <= 34;
                    if (short) {
                        wrap.setAttribute("role", "group");
                        const seg = document.createElement("span");
                        seg.className = "seg";
                        opts.forEach((o) => {
                            const b = document.createElement("button");
                            b.type = "button";
                            b.textContent = o;
                            b.addEventListener("click", () => apply(o));
                            seg.append(b);
                        });
                        wrap.append(seg);
                        ctl = { set: (v) => $$("button", seg).forEach((b) => b.setAttribute("aria-pressed", b.textContent === v.trim())) };
                    } else {
                        const s = document.createElement("select");
                        s.innerHTML = opts.map((o) => `<option>${esc(o)}</option>`).join("");
                        s.addEventListener("change", () => apply(s.value));
                        wrap.append(s);
                        ctl = {
                            set: (v) => {
                                v = v.trim();
                                if (![...s.options].some((o) => o.value === v)) s.insertAdjacentHTML("afterbegin", `<option>${esc(v)}</option>`);
                                s.value = v;
                            },
                        };
                    }
                }
                knobInputs.push({ k, ctl });
                knobsEl.append(wrap);
            });
            $(".editor-pane", card).append(knobsEl);
        }
        function syncKnobs() {
            for (const { k, ctl } of knobInputs) {
                const hit = findDecl(state.css, k.sel, k.prop);
                if (hit) ctl.set(hit.value);
            }
        }

        /* -- redimensionare -- */
        const showWidth = () => { wLabel.textContent = `${Math.round(frameBox.getBoundingClientRect().width)}px`; };
        if (resizable) {
            const grip = $(".grip", card);
            const presets = document.createElement("span");
            presets.className = "width-presets";
            [["360", 360], ["768", 768], ["100%", null]].forEach(([lab, w]) => {
                const b = toolButton("", lab, () => { frameBox.style.width = w ? `${w}px` : ""; showWidth(); });
                presets.append(b);
            });
            wLabel.after(presets);
            let sx = 0, sw = 0;
            const move = (e) => {
                const max = frameBox.parentElement.clientWidth - 34;
                frameBox.style.width = `${Math.max(200, Math.min(max, sw + e.clientX - sx))}px`;
                showWidth();
            };
            const up = () => {
                grip.classList.remove("drag");
                frameBox.classList.remove("dragging");
                removeEventListener("pointermove", move);
                removeEventListener("pointerup", up);
            };
            grip.addEventListener("pointerdown", (e) => {
                e.preventDefault();
                sx = e.clientX;
                sw = frameBox.getBoundingClientRect().width;
                grip.classList.add("drag");
                frameBox.classList.add("dragging");
                addEventListener("pointermove", move);
                addEventListener("pointerup", up);
            });
            grip.addEventListener("keydown", (e) => {
                const d = e.key === "ArrowLeft" ? -20 : e.key === "ArrowRight" ? 20 : 0;
                if (!d) return;
                e.preventDefault();
                frameBox.style.width = `${Math.max(200, frameBox.getBoundingClientRect().width + d)}px`;
                showWidth();
            });
            if ("ResizeObserver" in window) new ResizeObserver(showWidth).observe(frameBox);
        } else {
            wLabel.textContent = "";
        }

        showTab(active);
        syncKnobs();
        el.replaceWith(card);
        if (lazy) lazy.observe(card); else card.__mount();
        return card;
    }

    /* ============ Construirea paginii ============ */
    function slug(text) {
        const num = text.match(/^(\d+(?:\.\d+)*)\.?\s/);
        if (num) return "s" + num[1].replace(/\./g, "-");
        return fold(text).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }

    function build() {
        const sections = $$("section.lesson");
        const used = new Set();
        const toc = $("#toc");
        const items = [];

        for (const sec of sections) {
            const h2 = document.createElement("h2");
            h2.innerHTML = `<span class="num">${esc(sec.dataset.num || "")}</span><span>${inline(sec.dataset.title || "")}</span>`;
            sec.prepend(h2);
            used.add(sec.id);

            for (const md of $$(':scope > script[type="text/markdown"]', sec)) md.replaceWith(renderMarkdown(md.textContent));
            const demos = $$(".demo", sec).map(createDemo);

            const subs = [];
            for (const h3 of $$(".prose h3", sec)) {
                let id = slug(h3.textContent) || "sub";
                while (used.has(id)) id += "-";
                used.add(id);
                h3.id = id;
                h3.insertAdjacentHTML("beforeend", `<a class="anchor" href="#${id}" aria-label="Legătură către secțiune">#</a>`);
                subs.push(h3);
            }

            const qa = $$(".qa", sec);
            if (qa.length) {
                const t = document.createElement("div");
                t.className = "qa-tools";
                const all = (open) => qa.forEach((d) => (d.open = open));
                t.append(
                    toolButton("", "Deschide toate răspunsurile", () => all(true), "icon-btn"),
                    toolButton("", "Închide toate", () => all(false), "icon-btn"),
                );
                qa[0].before(t);
            }

            const li = document.createElement("li");
            li.innerHTML = `<a href="#${sec.id}"><span class="n">${esc(sec.dataset.num || "")}</span><span>${inline(sec.dataset.title || "")}</span>${demos.length ? `<span class="demo-count" title="exemple live">${demos.length}</span>` : ""}</a>`;
            if (subs.length) {
                const ol = document.createElement("ol");
                for (const h3 of subs) {
                    const a = document.createElement("a");
                    a.href = `#${h3.id}`;
                    a.textContent = h3.textContent.replace(/#$/, "");
                    const sli = document.createElement("li");
                    sli.append(a);
                    ol.append(sli);
                }
                li.append(ol);
            }
            toc.append(li);
            items.push({ sec, li, text: fold(sec.textContent), subs });
        }

        $("#stat-sections").textContent = sections.length;
        $("#stat-demos").textContent = demoCount;
        $("#stat-qa").textContent = $$(".qa").length;

        setupSearch(items);
        setupSpy(sections);
    }

    /* ============ Căutare în cuprins ============ */
    function setupSearch(items) {
        const input = $("#search");
        const empty = $("#toc-empty");
        input.addEventListener("input", () => {
            const q = fold(input.value.trim());
            let shown = 0;
            for (const it of items) {
                const subLis = $$("ol > li", it.li);
                if (!q) {
                    it.li.hidden = false;
                    subLis.forEach((s) => (s.hidden = false));
                    it.li.classList.remove("open");
                    continue;
                }
                const titleHit = fold(it.li.firstElementChild.textContent).includes(q);
                let subHit = 0;
                subLis.forEach((s) => {
                    const hit = fold(s.textContent).includes(q);
                    s.hidden = !hit && !titleHit;
                    if (hit) subHit++;
                });
                const hit = titleHit || subHit || it.text.includes(q);
                it.li.hidden = !hit;
                it.li.classList.toggle("open", !!subHit);
                if (hit) shown++;
            }
            empty.hidden = !q || shown > 0;
            if (!q) spy();
        });
        addEventListener("keydown", (e) => {
            if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) {
                e.preventDefault();
                input.focus();
            }
        });
    }

    /* ============ Scrollspy + progres ============ */
    let spy = () => {};
    function setupSpy(sections) {
        const heads = $$("section.lesson > h2, .prose h3");
        const links = new Map($$("#toc a").map((a) => [a.getAttribute("href").slice(1), a]));
        const progress = $(".progress");
        const toTop = $(".to-top");
        let ticking = false;
        spy = () => {
            ticking = false;
            const y = 110;
            let current = null;
            for (const h of heads) {
                if (h.getBoundingClientRect().top - y <= 0) current = h; else break;
            }
            const doc = document.documentElement;
            progress.style.setProperty("--p", (doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight)).toFixed(4));
            toTop.classList.toggle("show", doc.scrollTop > 900);
            if ($("#search").value.trim()) return;
            $$("#toc a.active").forEach((a) => a.classList.remove("active"));
            $$("#toc > li.open").forEach((l) => l.classList.remove("open"));
            if (!current) return;
            const sec = current.closest("section.lesson");
            const secLink = links.get(sec.id);
            if (secLink) {
                secLink.classList.add("active");
                secLink.parentElement.classList.add("open");
                // ține intrarea activă vizibilă în bara laterală
                const side = $(".sidebar");
                const r = secLink.getBoundingClientRect(), sr = side.getBoundingClientRect();
                if (r.top < sr.top + 60 || r.bottom > sr.bottom - 40) side.scrollTop += r.top - sr.top - sr.height / 3;
            }
            if (current.tagName === "H3") links.get(current.id)?.classList.add("active");
        };
        addEventListener("scroll", () => {
            if (!ticking) { ticking = true; requestAnimationFrame(spy); }
        }, { passive: true });
        spy();
    }

    /* ============ Temă, meniu mobil ============ */
    function setupChrome() {
        const root = document.documentElement;
        const btn = $("#theme");
        const modes = ["auto", "light", "dark"];
        const labels = { auto: "Temă: auto", light: "Temă: luminoasă", dark: "Temă: întunecată" };
        const apply = (m) => {
            if (m === "auto") root.removeAttribute("data-theme"); else root.dataset.theme = m;
            btn.textContent = labels[m];
            btn.dataset.mode = m;
        };
        apply(store.get("css-avansat-theme") || "auto");
        btn.addEventListener("click", () => {
            const next = modes[(modes.indexOf(btn.dataset.mode) + 1) % modes.length];
            store.set("css-avansat-theme", next);
            apply(next);
        });

        $("#menu").addEventListener("click", () => document.body.classList.toggle("nav-open"));
        $("#toc").addEventListener("click", (e) => {
            if (e.target.closest("a")) document.body.classList.remove("nav-open");
        });
        $(".to-top").addEventListener("click", () => scrollTo({ top: 0 }));
    }

    setupChrome();
    build();
    if (location.hash) {
        const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (t) {
            // previzualizările își ajustează înălțimea după încărcare, deci repoziționăm de câteva ori
            let moved = false;
            addEventListener("wheel", () => (moved = true), { once: true, passive: true });
            addEventListener("touchstart", () => (moved = true), { once: true, passive: true });
            [0, 500, 1200, 2500].forEach((ms) => setTimeout(() => moved || t.scrollIntoView({ behavior: "instant" }), ms));
        }
    }
})();
