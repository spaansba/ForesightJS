import { ChangeDetectionStrategy, Component, computed, input, output, signal } from "@angular/core"
import { ForesightDirective, type ForesightOptions } from "@foresightjs/angular"
import { queryCache, type QueryState } from "../shared/prefetch-query"
import { injectReactivateAfter, sleep } from "../shared/foresight-controls"

type PageData = {
  title: string
  description: string
  stats: { label: string; value: string }[]
  fetchedAt: number
}

type ForesightImage = {
  id: string
  name: string
  url: string
  secondUrl: string
}

type ImageResult = { blob: Blob; fromUrl: "first" | "second" }

const PAGES = [
  { slug: "about", label: "About" },
  { slug: "contact", label: "Contact" },
  { slug: "pricing", label: "Pricing" },
] as const

const IMAGES: ForesightImage[] = [
  {
    id: "mountains",
    name: "Mountains",
    url: "https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    secondUrl:
      "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  },
  {
    id: "ocean",
    name: "Ocean",
    url: "https://images.pexels.com/photos/416676/pexels-photo-416676.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    secondUrl:
      "https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  },
  {
    id: "forest",
    name: "Forest",
    url: "https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    secondUrl:
      "https://images.pexels.com/photos/326055/pexels-photo-326055.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  },
  {
    id: "city",
    name: "City",
    url: "https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    secondUrl:
      "https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  },
]

const fetchImage = async (image: ForesightImage, fetchCount: number): Promise<ImageResult> => {
  const isEven = fetchCount % 2 === 0
  const response = await fetch(isEven ? image.url : image.secondUrl)
  const blob = await response.blob()
  await sleep(400)

  return { blob, fromUrl: isEven ? "first" : "second" }
}

/** One image tile: predicting it prefetches the image, so the click is instant. */
@Component({
  selector: "app-foresight-image-button",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ForesightDirective],
  template: `
    <button
      type="button"
      [fsForesight]="options()"
      #f="foresight"
      (click)="load()"
      class="p-4 border border-gray-300 bg-white text-left cursor-pointer"
    >
      <div class="space-y-2">
        <h3 class="font-semibold text-gray-900">{{ image().name }}</h3>
        <div class="text-xs text-gray-500">id: {{ image().id }}</div>
        <dl class="text-xs font-mono divide-y divide-gray-200 border-y border-gray-200">
          <div class="flex justify-between py-1">
            <dt class="text-gray-500">fetching</dt>
            <dd [class]="query().isFetching ? 'text-gray-900' : 'text-gray-400'">
              {{ query().isFetching }}
            </dd>
          </div>
          <div class="flex justify-between py-1">
            <dt class="text-gray-500">refetching</dt>
            <dd [class]="isRefetching() ? 'text-gray-900' : 'text-gray-400'">
              {{ isRefetching() }}
            </dd>
          </div>
          <div class="flex justify-between py-1">
            <dt class="text-gray-500">stale</dt>
            <dd [class]="query().isStale ? 'text-gray-900' : 'text-gray-400'">
              {{ query().isStale }}
            </dd>
          </div>
          <div class="flex justify-between py-1">
            <dt class="text-gray-500">hasData</dt>
            <dd [class]="query().data ? 'text-gray-900' : 'text-gray-400'">{{ !!query().data }}</dd>
          </div>
          <div class="flex justify-between py-1">
            <dt class="text-gray-500">fromUrl</dt>
            <dd [class]="query().data ? 'text-gray-900' : 'text-gray-400'">
              {{ query().data?.fromUrl ?? "none" }}
            </dd>
          </div>
        </dl>
        <dl class="text-xs font-mono divide-y divide-gray-200 border-y border-gray-200">
          <div class="flex justify-between py-1">
            <dt class="text-gray-500">hits</dt>
            <dd class="text-gray-900">{{ f.state().hitCount }}</dd>
          </div>
          <div class="flex justify-between py-1">
            <dt class="text-gray-500">predicted</dt>
            <dd [class]="f.state().isPredicted ? 'text-gray-900' : 'text-gray-400'">
              {{ f.state().isPredicted ? "yes" : "no" }}
            </dd>
          </div>
          <div class="flex justify-between py-1">
            <dt class="text-gray-500">cb running</dt>
            <dd [class]="f.state().isCallbackRunning ? 'text-gray-900' : 'text-gray-400'">
              {{ f.state().isCallbackRunning ? "yes" : "no" }}
            </dd>
          </div>
          <div class="flex justify-between py-1">
            <dt class="text-gray-500">status</dt>
            <dd class="text-gray-900">{{ f.state().status ?? "-" }}</dd>
          </div>
        </dl>
      </div>
    </button>
  `,
})
export class ForesightImageButtonComponent {
  readonly image = input.required<ForesightImage>()
  readonly selected = output<{ name: string; blob: Blob }>()

  private readonly reactivateAfter = injectReactivateAfter()

  protected readonly query = computed(() =>
    queryCache.state<ImageResult>(`image:${this.image().id}`)()
  )
  protected readonly isRefetching = computed(() => this.query().isFetching && !!this.query().data)

  protected readonly options = computed<ForesightOptions>(() => ({
    callback: () => this.prefetch(),
    name: this.image().name,
    reactivateAfter: this.reactivateAfter(),
  }))

  private prefetch(): void {
    const image = this.image()
    queryCache.prefetch(`image:${image.id}`, count => fetchImage(image, count), { staleTime: 3000 })
  }

  protected async load(): Promise<void> {
    const image = this.image()
    const result = await queryCache.fetch(`image:${image.id}`, count => fetchImage(image, count), {
      staleTime: 3000,
    })
    if (result) {
      this.selected.emit({ name: image.name, blob: result.blob })
    }
  }
}

/**
 * Real-world prefetch demo (Angular twin of the React Home page): hovering a
 * page or image button predicts it and warms the shared query cache, so the
 * subsequent click renders from cache without a spinner.
 */
@Component({
  selector: "app-home-page",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ForesightDirective, ForesightImageButtonComponent],
  template: `
    <main class="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <section class="space-y-4">
        <h1 class="text-xl font-semibold">Data prefetching</h1>
        <nav class="flex gap-3">
          @for (page of pages; track page.slug) {
            <button
              type="button"
              [fsForesight]="{
                callback: prefetchPage(page.slug),
                name: page.slug,
                hitSlop: 20,
                reactivateAfter: reactivateAfter(),
              }"
              (click)="selectPage(page.slug)"
              class="px-5 py-3 border text-sm font-medium transition-colors cursor-pointer"
              [class.border-gray-900]="activePage() === page.slug"
              [class.bg-gray-900]="activePage() === page.slug"
              [class.text-white]="activePage() === page.slug"
              [class.border-gray-400]="activePage() !== page.slug"
              [class.text-gray-800]="activePage() !== page.slug"
              [class.hover:bg-gray-100]="activePage() !== page.slug"
            >
              {{ page.label }}
            </button>
          }
        </nav>

        @if (activePage(); as slug) {
          @let ps = pageState();
          @if (ps?.isFetching && !ps?.data) {
            <section class="border border-gray-300 bg-white p-6 space-y-3">
              <div class="animate-pulse space-y-3">
                <div class="h-5 bg-gray-200 rounded w-1/3"></div>
                <div class="h-4 bg-gray-200 rounded w-full"></div>
                <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                <div class="grid grid-cols-3 gap-4 pt-2">
                  <div class="h-16 bg-gray-200 rounded"></div>
                  <div class="h-16 bg-gray-200 rounded"></div>
                  <div class="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
              <p class="text-xs text-gray-400 font-mono">Loading data...</p>
            </section>
          } @else if (ps?.data; as data) {
            <section class="border border-gray-300 bg-white p-6 space-y-4">
              <div class="flex items-center justify-between">
                <h2 class="text-base font-semibold">{{ data.title }}</h2>
                @if (ps?.isFetching) {
                  <span class="text-xs text-gray-400">refetching...</span>
                }
              </div>
              <p class="text-sm text-gray-700 leading-relaxed">{{ data.description }}</p>
              <div class="grid grid-cols-3 gap-4">
                @for (stat of data.stats; track stat.label) {
                  <div class="border border-gray-200 p-3 space-y-1">
                    <div class="text-xs text-gray-500">{{ stat.label }}</div>
                    <div class="text-sm font-medium text-gray-900">{{ stat.value }}</div>
                  </div>
                }
              </div>
              <p class="text-xs text-gray-400 font-mono">
                fetched at {{ formatTime(data.fetchedAt) }}
              </p>
            </section>
          }
        }
      </section>

      <section class="space-y-4">
        <h2 class="text-lg font-semibold">Images</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (image of images; track image.id) {
            <app-foresight-image-button [image]="image" (selected)="onImageSelected($event)" />
          }
        </div>
        @if (selectedImage(); as selected) {
          <div class="border border-gray-300 bg-white p-6 space-y-4">
            <h3 class="text-base font-semibold">{{ selected.name }}</h3>
            <img [src]="selected.url" [alt]="selected.name" class="w-full h-96 object-cover" />
          </div>
        }
      </section>
    </main>
  `,
})
export class HomePageComponent {
  protected readonly pages = PAGES
  protected readonly images = IMAGES
  protected readonly reactivateAfter = injectReactivateAfter()

  protected readonly activePage = signal<string | null>(null)
  protected readonly selectedImage = signal<{ name: string; url: string } | null>(null)

  protected readonly pageState = computed<QueryState<PageData> | null>(() => {
    const slug = this.activePage()

    return slug ? queryCache.state<PageData>(`page:${slug}`)() : null
  })

  protected readonly prefetchPage = (slug: string) => () => {
    queryCache.prefetch(`page:${slug}`, () => this.fetchPage(slug))
  }

  protected selectPage(slug: string): void {
    this.activePage.set(slug)
    queryCache.fetch(`page:${slug}`, () => this.fetchPage(slug))
  }

  protected onImageSelected(event: { name: string; blob: Blob }): void {
    this.selectedImage.set({ name: event.name, url: URL.createObjectURL(event.blob) })
  }

  protected formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString()
  }

  private async fetchPage(slug: string): Promise<PageData> {
    const response = await fetch(`/api/${slug}.json`)
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${slug} (${response.status})`)
    }

    const data = await response.json()

    return { ...data, fetchedAt: Date.now() }
  }
}
