import { themes as prismThemes } from "prism-react-renderer"
import type { Config } from "@docusaurus/types"
import type * as Preset from "@docusaurus/preset-classic"
import { PluginOptions as LLMPluginOptions } from "@signalwire/docusaurus-plugin-llms-txt"
import "dotenv/config"

const config: Config = {
  title: "ForesightJS",
  tagline: "The most modern way to prefetch your data",
  favicon: "img/favicon.ico",
  url: "https://foresightjs.com",
  baseUrl: "/",
  organizationName: "spaansba",
  projectName: "ForesightJS",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  customFields: {
    POSTHOG_KEY: process.env.VITE_PUBLIC_POSTHOG_KEY,
    POSTHOG_HOST: process.env.VITE_PUBLIC_POSTHOG_HOST,
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/spaansba/ForesightJS/tree/main/packages/docs",
        },
        // blog: {
        //   showReadingTime: true,
        //   feedOptions: {
        //     type: ["rss", "atom"],
        //     xslt: true,
        //   },
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   editUrl: "https://github.com/spaansba/ForesightJS/tree/main/docs",
        //   // Useful options to enforce blogging best practices
        //   onInlineTags: "warn",
        //   onInlineAuthors: "warn",
        //   onUntruncatedBlogPosts: "warn",
        // },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins: [
    [
      "@signalwire/docusaurus-plugin-llms-txt",
      {
        siteTitle: "ForesightJS",
        siteDescription:
          "Comprehensive guide to ForesightJS, the most modern way to prefetch your data. Check out llms-full.txt for the full txt and llms.txt for an overview of the docs.",
        depth: 2,
        content: {
          includeBlog: false,
          includePages: true,
          enableMarkdownFiles: true,
          enableLlmsFullTxt: true,
        },
      } satisfies LLMPluginOptions,
    ],
  ],

  themeConfig: {
    // image: "img/docusaurus-social-card.jpg",
    algolia: {
      appId: "BOP697VONY",
      apiKey: "a8fc98d356c7f6be1fbe5a6acb214a3a", // this is safe lol
      indexName: "ForesightJS Doc",
      // Optional: see doc section below
      contextualSearch: false,
      // Optional: path for search page that enabled by default (`false` to disable it)
      searchPagePath: "search",
      insights: true,
    },
    navbar: {
      title: "ForesightJS",
      logo: {
        alt: "ForesightJS Logo",
        src: "img/logo.svg",
      },
      hideOnScroll: false,
      style: "dark",
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Documentation",
        },
        {
          to: "https://foresightjs.com/#playground",
          label: "Playground",
          position: "left",
        },
        {
          type: "docsVersionDropdown",
          position: "left",
        },
        {
          href: "https://github.com/spaansba/ForesightJS",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      // links: [
      //   {
      //     title: "Docs",
      //     items: [
      //       {
      //         label: "Tutorial",
      //         to: "/docs/intro",
      //       },
      //     ],
      //   },
      //   {
      //     title: "Community",
      //     items: [
      //       {
      //         label: "Discord",
      //         href: "https://discordapp.com/invite/docusaurus",
      //       },
      //       {
      //         label: "X",
      //         href: "https://x.com/docusaurus",
      //       },
      //     ],
      //   },
      //   {
      //     title: "More",
      //     items: [
      //       {
      //         label: "Blog",
      //         to: "/blog",
      //       },
      //       {
      //         label: "GitHub",
      //         href: "https://github.com/spaansba/ForesightJS",
      //       },
      //     ],
      //   },
      // ],
      copyright: `Copyright © ${new Date().getFullYear()} ForesightJS, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.vsDark,
      darkTheme: prismThemes.vsDark,
    },
    colorMode: {
      defaultMode: "dark",
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
