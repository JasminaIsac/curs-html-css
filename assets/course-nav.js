(() => {
    "use strict";

    const script = document.currentScript;
    const base = new URL("../../", script.src);

    const path = location.pathname.replace(/\\/g, "/");
    const match = path.match(/prelegeri\/([^/]+)\//) || location.href.replace(/\\/g, "/").match(/prelegeri\/([^/]+)\//);
    const slug = match ? match[1] : null;
    if (!slug) return;

    function esc(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function escAttr(s) {
        return esc(s).replace(/"/g, "&quot;");
    }

    function paint(data) {
        const themes = data.themes || [];
        const i = themes.findIndex((t) => t.slug === slug);
        if (i < 0) return;
        const cur = themes[i];
        const prev = i > 0 ? themes[i - 1] : null;
        const next = i < themes.length - 1 ? themes[i + 1] : null;
        const home = new URL("index.html", base).href;

        const strip = document.createElement("div");
        strip.className = "course-strip";
        strip.setAttribute("role", "navigation");
        strip.setAttribute("aria-label", "Navigare curs");

        const prevHtml = prev
            ? (prev.status === "ready"
                ? `<a href="${escAttr(new URL("prelegeri/" + prev.slug + "/index.html", base).href)}">← ${esc(prev.id)}</a>`
                : `<span class="cs-muted">← ${esc(prev.id)}</span>`)
            : "";
        const nextHtml = next
            ? (next.status === "ready"
                ? `<a href="${escAttr(new URL("prelegeri/" + next.slug + "/index.html", base).href)}">${esc(next.id)} →</a>`
                : `<span class="cs-muted">${esc(next.id)} →</span>`)
            : "";

        strip.innerHTML = `
<a href="${escAttr(home)}">← Toate temele</a>
<span class="cs-here">${esc(cur.id)}. ${esc(cur.title)}</span>
<span class="cs-nav">${prevHtml}${nextHtml}</span>`;

        document.body.prepend(strip);
    }

    if (window.ATELIER_COURSE) {
        paint(window.ATELIER_COURSE);
        return;
    }

    const dataScript = document.createElement("script");
    dataScript.src = new URL("assets/course-data.js", base).href;
    dataScript.onload = () => paint(window.ATELIER_COURSE || { themes: [] });
    dataScript.onerror = () => {
        fetch(new URL("assets/course.json", base))
            .then((r) => r.json())
            .then(paint)
            .catch(() => {});
    };
    document.head.append(dataScript);
})();
