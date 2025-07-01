export function evaluateRegistrationConditions(): { shouldRegister: boolean } {
  return {
    shouldRegister: typeof window !== "undefined" && !("ontouchstart" in window),
  }
}
