import { html, svg, type SVGTemplateResult } from "lit"

const icon = (content: SVGTemplateResult) => html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    ${content}
  </svg>
`

export const CONTROL_PANEL_SVG = icon(svg`
  <rect x="2" y="4" width="20" height="16" rx="2" />
  <path d="M2 9h20" />
  <path d="M6 4v5" />
`)

export const CONSOLE_SVG = icon(svg`
  <path d="m4 17 6-6-6-6" />
  <path d="M12 19h8" />
`)

export const BOTH_SVG = icon(svg`
  <path d="M16 3h5v5" />
  <path d="M8 3H3v5" />
  <path d="M12 22v-8.3a4 4 0 0 0-1.17-2.87L3 3" />
  <path d="m15 9 6-6" />
`)

export const NONE_SVG = icon(svg`
  <circle cx="12" cy="12" r="10" />
  <path d="m4.9 4.9 14.2 14.2" />
`)

export const VISIBILITY_SVG = icon(svg`
  <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
  <circle cx="12" cy="12" r="3" />
`)

export const DOCUMENT_SVG = icon(svg`
  <path d="M21 12h-8" />
  <path d="M21 6H8" />
  <path d="M21 18h-8" />
  <path d="M3 6v4c0 1.1.9 2 2 2h3" />
  <path d="M3 10v6c0 1.1.9 2 2 2h3" />
`)

export const INSERTION_SVG = icon(svg`
  <path d="M10 6h11" />
  <path d="M10 12h11" />
  <path d="M10 18h11" />
  <path d="M4 6h1v4" />
  <path d="M4 10h2" />
  <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
`)

export const FILTER_SVG = icon(svg`
  <path d="M3 6h18" />
  <path d="M7 12h10" />
  <path d="M10 18h4" />
`)

export const CLEAR_SVG = icon(svg`
  <path d="M3 6h18" />
  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
`)

export const COPY_SVG = icon(svg`
  <rect x="8" y="8" width="14" height="14" rx="2" />
  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
`)

export const TICK_SVG = icon(svg`<path d="M20 6 9 17l-5-5" />`)

export const WARNING_SVG = icon(svg`
  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
  <path d="M12 9v4" />
  <path d="M12 17h.01" />
`)

export const STATE_SVG = icon(svg`
  <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
  <path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
`)

export const UNREGISTER_SVG = icon(svg`
  <path d="m18.84 12.25 1.72-1.71h-.02a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
  <path d="m5.17 11.75-1.71 1.71a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  <path d="M8 2v3" />
  <path d="M2 8h3" />
  <path d="M16 22v-3" />
  <path d="M22 16h-3" />
`)

export const DISABLED_SVG = icon(svg`
  <path d="M18.36 6.64A9 9 0 0 1 20.77 15" />
  <path d="M6.16 6.16a9 9 0 1 0 12.68 12.68" />
  <path d="M12 2v4" />
  <path d="m2 2 20 20" />
`)

export const ENABLE_SVG = icon(svg`
  <path d="M12 2v10" />
  <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
`)

export const MINIMIZE_SVG = icon(svg`
  <path d="m14 10 7-7" />
  <path d="M20 10h-6V4" />
  <path d="m3 21 7-7" />
  <path d="M4 14h6v6" />
`)

export const EXPAND_SVG = icon(svg`
  <path d="M15 3h6v6" />
  <path d="m21 3-7 7" />
  <path d="m3 21 7-7" />
  <path d="M9 21H3v-6" />
`)

export const CLOSE_SVG = icon(svg`
  <path d="M18 6 6 18" />
  <path d="m6 6 12 12" />
`)

export const CHEVRON_SVG = icon(svg`<path d="m9 18 6-6-6-6" />`)
