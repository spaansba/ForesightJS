import { ChangeDetectionStrategy, Component } from "@angular/core"
import { RouterLink, RouterLinkActive } from "@angular/router"
import { ForesightDirective } from "@foresightjs/angular"
import { routeImports } from "../routes"

/**
 * Sticky top nav. Each link carries `[fsForesight]` so predicting it warms the
 * target route's lazy chunk before the click — the directive's headline use case.
 */
@Component({
  selector: "app-navigation",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, ForesightDirective],
  template: `
    <header class="bg-white border-b border-gray-300 sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <a
          routerLink="/"
          [fsForesight]="prefetch['/']"
          fsForesightName="nav-logo"
          class="text-base font-semibold text-gray-900"
        >
          ForesightJS Angular
        </a>
        <nav class="flex items-center gap-4 text-sm">
          <a
            routerLink="/"
            routerLinkActive="text-gray-900 font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            [fsForesight]="prefetch['/']"
            fsForesightName="nav-home"
            class="text-gray-700 hover:text-gray-900"
          >
            Home
          </a>
          <a
            routerLink="/elements"
            routerLinkActive="text-gray-900 font-medium"
            [fsForesight]="prefetch['/elements']"
            fsForesightName="nav-elements"
            class="text-gray-700 hover:text-gray-900"
          >
            Elements
          </a>
          <a
            routerLink="/mass"
            routerLinkActive="text-gray-900 font-medium"
            [fsForesight]="prefetch['/mass']"
            fsForesightName="nav-mass"
            class="text-gray-700 hover:text-gray-900"
          >
            Mass test
          </a>
          <a
            routerLink="/events"
            routerLinkActive="text-gray-900 font-medium"
            [fsForesight]="prefetch['/events']"
            fsForesightName="nav-events"
            class="text-gray-700 hover:text-gray-900"
          >
            Events
          </a>
        </nav>
      </div>
    </header>
  `,
})
export class NavigationComponent {
  // The directive accepts a bare callback; predicting the link fires the matching
  // route import so its chunk is cached by the time the user clicks.
  protected readonly prefetch = routeImports
}
