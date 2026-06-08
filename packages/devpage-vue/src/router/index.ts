import { createRouter, createWebHistory } from "vue-router"
import DirectivePage from "../views/directive/index.vue"
import ComposablePage from "../views/composable/index.vue"
import ForesightsPage from "../views/foresights/index.vue"
import EventsPage from "../views/events/index.vue"
import DetachPage from "../views/detach/index.vue"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "directive",
      component: DirectivePage,
    },
    {
      path: "/composable",
      name: "composable",
      component: ComposablePage,
    },
    {
      path: "/foresights",
      name: "foresights",
      component: ForesightsPage,
    },
    {
      path: "/events",
      name: "events",
      component: EventsPage,
    },
    {
      path: "/detach",
      name: "detach",
      component: DetachPage,
    },
  ],
})

export default router
