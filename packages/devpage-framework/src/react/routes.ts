export const routeImports = {
  "/": () => import("./pages/home"),
  "/elements": () => import("./pages/elements"),
  "/mass": () => import("./pages/mass"),
  "/events": () => import("./pages/events"),
} as const
