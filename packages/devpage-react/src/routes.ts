export const routeImports = {
  "/": () => import("./pages/home"),
  "/elements": () => import("./pages/elements"),
  "/mass": () => import("./pages/mass"),
} as const
