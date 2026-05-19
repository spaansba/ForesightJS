import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import "./style.css"
import { vForesight } from "@foresightjs/vue"

const app = createApp(App)

app.use(router)

app.directive("foresight", vForesight)

app.mount("#app")
