const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = async function (eleventyConfig) {
  const { HtmlBasePlugin } = await import("@11ty/eleventy");

  // ---- Passthroughs / Watch ----
  eleventyConfig.addPassthroughCopy("src-archive/posts/**/img");
  eleventyConfig.addPassthroughCopy({ "src-archive/assets": "assets" });
  eleventyConfig.addWatchTarget("src-archive/assets/styles.css");

  // ---- Filters ----
  eleventyConfig.addFilter("monthLabel", (val) => {
    if (val instanceof Date) {
      const m = String(val.getMonth() + 1).padStart(2, "0");
      const y = val.getFullYear();
      return `${m}/${y}`;
    }
    const s = String(val);
    const [y, m] = s.split("-");
    return y && m ? `${m.padStart(2, "0")}/${y}` : s;
  });

  eleventyConfig.addFilter("dateChip", (d) => {
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });

  eleventyConfig.addFilter("monthWindow", function (startYm, count = 10) {
    if (!startYm) return [];
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

  eleventyConfig.addFilter("monthWindowFixed", function (startYm, count = 12) {
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

  eleventyConfig.addCollection("postsByMonth", (api) => {
    const posts = api
      .getFilteredByGlob("src-archive/posts/**/*.md")
      .sort((a, b) => b.date - a.date);
    const groups = new Map();
    for (const p of posts) {
      const d = p.date;
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!groups.has(ym)) groups.set(ym, []);
      groups.get(ym).push(p);
    }
    return Array.from(groups, ([ym, items]) => ({
      ym,
      items,
      date: new Date(ym),
      url: `/posts/${ym}/`,
    }));
  });

  eleventyConfig.addShortcode(
    "fig",
    function (filename, alt = "", caption = "") {
      const d = this.page.date;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const src = `/posts/${y}-${m}/img/${filename}`;
      return `<figure>
      <img src="${src}" alt="${alt}" loading="lazy">
      ${caption ? `<figcaption>${caption}</figcaption>` : ""}
    </figure>`;
    },
  );

  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(pluginRss);

  return {
    pathPrefix: "/archive",
    dir: {
      input: "src-archive",
      includes: "_includes",
      data: "_data",
      output: "archive",
    },
  };
};
