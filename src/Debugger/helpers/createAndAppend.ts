export function createAndAppendElement(
  tag: string,
  parent: Node,
  className?: string,
  id?: string
): HTMLElement {
  const element = document.createElement(tag)
  if (id) element.id = id
  if (className) element.className = className
  return parent.appendChild(element)
}

export function createAndAppendStyle(styleSheet: string, parent: Node, id: string) {
  const element = document.createElement("style")
  element.textContent = styleSheet
  element.id = "control-panel"
  return parent.appendChild(element)
}
