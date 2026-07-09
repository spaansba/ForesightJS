import { vi } from "vitest"

export const prefetch = vi.fn<(url: string) => void>()
