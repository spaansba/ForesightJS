import type { Routes } from "@angular/router"

// Lazy imports double as prefetch triggers for the nav links (mirrors the React
// routes.ts and Vue router), so predicting a nav link warms its route chunk.
export const routeImports = {
  "/": () => import("./pages/home.page"),
  "/elements": () => import("./pages/elements.page"),
  "/mass": () => import("./pages/mass.page"),
  "/events": () => import("./pages/events.page"),
} as const

export const routes: Routes = [
  { path: "", loadComponent: () => routeImports["/"]().then(m => m.HomePageComponent) },
  {
    path: "elements",
    loadComponent: () => routeImports["/elements"]().then(m => m.ElementsPageComponent),
  },
  { path: "mass", loadComponent: () => routeImports["/mass"]().then(m => m.MassPageComponent) },
  {
    path: "events",
    loadComponent: () => routeImports["/events"]().then(m => m.EventsPageComponent),
  },
]
