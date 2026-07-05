import { ChangeDetectionStrategy, Component } from "@angular/core"
import { RouterOutlet } from "@angular/router"
import { NavigationComponent } from "./components/navigation.component"

@Component({
  selector: "app-root",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavigationComponent],
  template: `
    <div class="min-h-screen bg-stone-50 text-gray-900">
      <app-navigation />
      <router-outlet />
    </div>
  `,
})
export class AppComponent {}
