(() => {
  const shaLink = document.querySelector('a[href*="github.com"][href*="/tree/"]');
  const sha = shaLink ? (shaLink.href.match(/\/tree\/([0-9a-f]{7,40})/) || [])[1] || "" : "";

  const main = document.querySelector("main article, main, article") || document.body;

  const inline = (el) => {
    let out = "";
    for (const n of el.childNodes) {
      if (n.nodeType === Node.TEXT_NODE) { out += n.textContent; continue; }
      if (n.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = n.tagName;
      if (tag === "A") {
        const href = n.getAttribute("href") || "";
        const text = inline(n).trim();
        if (!text) continue;
        out += href.includes("github.com") ? `[${text}](${href})` : text;
      } else if (tag === "CODE") {
        out += "`" + n.textContent.trim() + "`";
      } else if (tag === "STRONG" || tag === "B") {
        out += "**" + inline(n).trim() + "**";
      } else if (tag === "BR") {
        out += "\n";
      } else if (["BUTTON", "SVG", "IMG", "USE", "PATH"].includes(tag)) {
        // skip chrome: copy buttons, zoom icons, link icons
      } else {
        out += inline(n);
      }
    }
    return out;
  };

  const clean = (s) => s.replace(/ /g, " ").replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").trim()
    .replace(/^(zoom_in|link|content_copyCopy)+/g, "").replace(/(zoom_in|link)$/g, "");

  const table = (t) => {
    const rows = [...t.querySelectorAll("tr")].map((tr) =>
      [...tr.querySelectorAll("th,td")].map((c) => clean(inline(c)).replace(/\n/g, " ").replace(/\|/g, "\\|"))
    );
    if (!rows.length) return "";
    const width = Math.max(...rows.map((r) => r.length));
    const line = (r) => "| " + Array.from({ length: width }, (_, i) => r[i] || "").join(" | ") + " |";
    return [line(rows[0]), "|" + " --- |".repeat(width), ...rows.slice(1).map(line)].join("\n");
  };

  const blocks = [];
  const walk = (el) => {
    for (const n of el.children) {
      const tag = n.tagName;
      if (/^H[1-4]$/.test(tag)) {
        const txt = clean(inline(n));
        if (txt) blocks.push("#".repeat(+tag[1]) + " " + txt);
      } else if (tag === "P") {
        const txt = clean(inline(n));
        if (txt) blocks.push(txt);
      } else if (tag === "PRE") {
        blocks.push("```\n" + n.textContent.replace(/^\s*\w*\s*content_copyCopy/, "").trim() + "\n```");
      } else if (tag === "TABLE") {
        const md = table(n);
        if (md) blocks.push(md);
      } else if (tag === "UL" || tag === "OL") {
        const items = [...n.querySelectorAll(":scope > li")].map(
          (li, i) => (tag === "OL" ? `${i + 1}. ` : "- ") + clean(inline(li)).replace(/\n+/g, " ")
        );
        if (items.length) blocks.push(items.join("\n"));
      } else if (["NAV", "HEADER", "FOOTER", "BUTTON", "ASIDE"].includes(tag)) {
        // skip page chrome and "On this page" nav
      } else {
        walk(n);
      }
    }
  };
  walk(main);

  const seen = new Set();
  const dedup = blocks.filter((b) => {
    const k = b.slice(0, 200);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return JSON.stringify({ sha, markdown: dedup.join("\n\n") });
})()
