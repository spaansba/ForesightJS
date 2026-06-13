import type { SidebarsConfig } from "@docusaurus/plugin-content-docs"

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Three sidebars, one per framework. The FrameworkSelector component
 * (src/components/FrameworkSelector) switches between them by navigating to
 * the equivalent page in the target tree. JavaScript (core) is the default
 * tree and keeps the historical URLs; it must stay named `tutorialSidebar`
 * because the navbar item and the versioned (3.x) sidebars reference that id.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: "category",
      label: "Getting Started",
      items: [
        "getting-started/what-is-foresightjs",
        "getting-started/initialize-the-manager",
        "getting-started/quick-start",
      ],
    },
    {
      type: "category",
      label: "Configuration",
      items: ["configuration/global-settings", "configuration/registration-options"],
    },
    "getting-started/typescript",
    "other-frameworks",
    "migrating-to-v4",
    "events",
    {
      type: "category",
      label: "Debugging",
      items: ["debugging/devtools", "debugging/static-properties"],
    },
    "behind-the-scenes",
    "ai-context",
  ],
  reactSidebar: [
    {
      type: "category",
      label: "Getting Started",
      items: [
        "react/what-is-foresightjs",
        "react/installation",
        "react/initialize-the-manager",
        "react/quick-start",
      ],
    },
    {
      type: "category",
      label: "API",
      items: ["react/useForesight", "react/foresight-component", "react/useForesightEvent"],
    },
    {
      type: "category",
      label: "Guides",
      items: ["react/nextjs", "react/react-router"],
    },
    {
      type: "category",
      label: "Configuration",
      items: ["react/configuration/global-settings", "react/configuration/registration-options"],
    },
    "react/typescript",
    "react/migrating-to-v4",
    "react/events",
    {
      type: "category",
      label: "Debugging",
      items: ["react/devtools", "react/static-properties"],
    },
    "react/behind-the-scenes",
    "react/ai-context",
  ],
  vueSidebar: [
    {
      type: "category",
      label: "Getting Started",
      items: [
        "vue/what-is-foresightjs",
        "vue/installation",
        "vue/initialize-the-manager",
        "vue/quick-start",
      ],
    },
    {
      type: "category",
      label: "API",
      items: [
        "vue/directive",
        "vue/useForesight",
        "vue/foresight-component",
        "vue/useForesightEvent",
      ],
    },
    {
      type: "category",
      label: "Configuration",
      items: ["vue/configuration/global-settings", "vue/configuration/registration-options"],
    },
    "vue/typescript",
    "vue/migrating-to-v4",
    "vue/events",
    {
      type: "category",
      label: "Debugging",
      items: ["vue/devtools", "vue/static-properties"],
    },
    "vue/behind-the-scenes",
    "vue/ai-context",
  ],
}

export default sidebars
