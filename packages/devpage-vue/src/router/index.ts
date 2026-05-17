import { createRouter, createWebHistory } from "vue-router"
import DirectivePage from "../views/DirectivePage.vue"
import ComposablePage from "../views/ComposablePage.vue"
import ForesightsPage from "../views/ForesightsPage.vue"
import EventsPage from "../views/EventsPage.vue"

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
  ],
})

export default router
