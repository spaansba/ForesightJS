import type { SidebarsConfig } from "@docusaurus/plugin-content-docs"

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/what-is-foresightjs',
        'getting-started/initialize-the-manager',
        'getting-started/your-first-element',
        'getting-started/typescript',
      ],
    },
    {
      type: 'category',
      label: 'Configuration',
      items: [
        'configuration/global-settings',
        'configuration/element-settings',
      ],
    },
    {
      type: 'category',
      label: 'Integrations',
      items: [
        {
          type: 'category',
          label: 'React',
          items: [
            'integrations/react/useForesight',
            'integrations/react/nextjs',
            'integrations/react/react-router',
          ],
        },
        {
          type: 'category',
          label: 'Vue',
          items: [
            'integrations/vue/vue',
          ],
        },
        {
          type: 'category',
          label: 'Angular',
          items: [
            'integrations/angular/angular',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Debugging',
      items: [
        'debugging/devtools',
        'debugging/static-properties',
      ],
    },
    'events',
    'behind-the-scenes',
    'ai-context',
  ],
}

export default sidebars
