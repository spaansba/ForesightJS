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
