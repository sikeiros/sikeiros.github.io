// .eleventy.js — clean, single export
module.exports = function(eleventyConfig) {
  // ---- Passthroughs / Watch ----
  eleventyConfig.addPassthroughCopy("src-archive/posts/**/img");
  eleventyConfig.addPassthroughCopy({ "src-archive/assets": "assets" });
  eleventyConfig.addWatchTarget("src-archive/assets/styles.css");

  // We’ll need the url filter inside shortcodes so pathPrefix is respected
  const url = eleventyConfig.getFilter("url");

  // ---- Filters ----
  eleventyConfig.addFilter("monthLabel", (val) => {
    if (val instanceof Date) {
      const m = String(val.getMonth() + 1).padStart(2, "0");
      const y = val.getFullYear();
      return `${m}/${y}`;
    }
    const s = String(val); const [y, m] = s.split("-");
    return (y && m) ? `${m.padStart(2, "0")}/${y}` : s;
  });

  eleventyConfig.addFilter("dateChip", (d) => {
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });

  eleventyConfig.addFilter("monthWindow", function(startYm, count = 10) {
    if (!startYm) return [];
    const [yStr, mStr] = String(startYm).split("-");
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10);
    const out = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(Date.UTC(y, (m - 1) + i, 1));
      const yy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      out.push(`${yy}-${mm}`);
    }
    return out;
  });

  eleventyConfig.addFilter("monthAssetsBase", function(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `/posts/${y}-${m}/img/`;
  });

  // helper for shift logic
  function shiftYmCore(ym, offset = 0) {
    const [yStr, mStr] = String(ym).split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const d = new Date(Date.UTC(y, m - 1 + offset, 1));
    const yy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${yy}-${mm}`;
  }

  eleventyConfig.addFilter("shiftYm", function(ym, offset = 0) {
    return shiftYmCore(ym, offset);
  });

  eleventyConfig.addFilter("monthWindowFrom", function(startYm, count = 10, startOffset = 0) {
    const start = shiftYmCore(startYm, startOffset);
    const out = [];
    for (let i = 0; i < count; i++) out.push(shiftYmCore(start, i));
    return out;
  });

  eleventyConfig.addFilter("monthWindowFixed", function(startYm, count = 12) {
    const [yStr, mStr] = String(startYm).split("-");
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10);
    const out = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(Date.UTC(y, m - 1 + i, 1));
      const yy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      out.push(`${yy}-${mm}`);
    }
    return out;
  });

  // ---- Collections ----
  eleventyConfig.addCollection("postsByMonth", (api) => {
    // IMPORTANT: use src-archive here (not src)
    const posts = api.getFilteredByGlob("src-archive/posts/**/*.md")
      .sort((a, b) => b.date - a.date);
    const groups = new Map();
    for (const p of posts) {
      const d = p.date;
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!groups.has(ym)) groups.set(ym, []);
      groups.get(ym).push(p);
    }
    return Array.from(groups, ([ym, items]) => ({ ym, items }));
  });

  // ---- Shortcodes ----
  eleventyConfig.addShortcode("fig", function(filename, alt = "", caption = "") {
    const d = this.page.date;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    // Use the url filter so /archive pathPrefix is applied in production
    const src = url(`/posts/${y}-${m}/img/${filename}`);
    return `<figure>
      <img src="${src}" alt="${alt}" loading="lazy">
      ${caption ? `<figcaption>${caption}</figcaption>` : ""}
    </figure>`;
  });

  eleventyConfig.addPairedShortcode("row2", function(content) {
    return `<div class="row-2">${content}</div>`;
  });

  // ---- Final return (ONE return only) ----
  const isProd = process.env.ELEVENTY_ENV === "prod";
  return {
    pathPrefix: isProd ? "/archive/" : "/",
    dir: {
      input: "src-archive",
      includes: "_includes",
      data: "_data",
      output: "archive"
    }
  };
};
