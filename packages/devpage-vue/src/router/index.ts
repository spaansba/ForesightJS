import { createRouter, createWebHistory } from "vue-router"
import DirectivePage from "../views/DirectivePage.vue"
import ComposablePage from "../views/ComposablePage.vue"

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
  ],
})

export default router
