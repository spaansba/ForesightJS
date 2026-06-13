import { createRouter, createWebHistory } from "vue-router"

// Lazy imports double as prefetch triggers for ForesightRouterLink (mirrors the
// React demo's routes.ts), so predicting a nav link warms its route chunk.
export const routeImports = {
  "/": () => import("../views/directive/index.vue"),
  "/composable": () => import("../views/composable/index.vue"),
  "/events": () => import("../views/events/index.vue"),
  "/detach": () => import("../views/detach/index.vue"),
  "/mass": () => import("../views/mass/index.vue"),
} as const

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "directive", component: routeImports["/"] },
    { path: "/composable", name: "composable", component: routeImports["/composable"] },
    { path: "/events", name: "events", component: routeImports["/events"] },
    { path: "/detach", name: "detach", component: routeImports["/detach"] },
    { path: "/mass", name: "mass", component: routeImports["/mass"] },
  ],
})

export default router
