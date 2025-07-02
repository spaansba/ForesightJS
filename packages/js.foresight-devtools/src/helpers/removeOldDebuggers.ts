/**
 * removes stale debuggers that might have been left behind in the dom
 */
export function removeOldDebuggers() {
  const oldDebuggers = document.querySelectorAll("#jsforesight-debugger-shadow-host")
  oldDebuggers.forEach((element) => element.remove())
}
