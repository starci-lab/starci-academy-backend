// @ts-check
// StarCi backend product docs — a plain Docusaurus site (docs live under ./docs).
// This is a MOCK scaffold: the structure is real and runnable (`npm i && npm start`),
// the content under docs/ is placeholder to be replaced section by section.
const { themes } = require("prism-react-renderer");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "StarCi · Docs",
  tagline: "Product and engineering docs for the StarCi backend.",
  favicon: "img/favicon.ico",

  url: "https://starci183.github.io",
  baseUrl: "/starci-docs/",
  organizationName: "starci183",
  projectName: "starci-docs",
  trailingSlash: false,

  onBrokenLinks: "warn",
  onBrokenAnchors: "warn",
  markdown: { format: "detect", hooks: { onBrokenMarkdownLinks: "warn" } },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: "docs",
          routeBasePath: "/",
          sidebarPath: require.resolve("./sidebars.js"),
        },
        blog: false,
        theme: { customCss: require.resolve("./src/css/custom.css") },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "StarCi · Docs",
        items: [{ type: "docSidebar", sidebarId: "docs", position: "left", label: "Docs" }],
      },
      footer: { style: "dark", copyright: "StarCi backend docs." },
      prism: { theme: themes.github, darkTheme: themes.dracula },
    }),
};

module.exports = config;
