export function createAndAppendElement(
  tag: string,
  parent: Node,
  className?: string,
  data?: string,
  id?: string
): HTMLElement {
  const element = document.createElement(tag)
  if (id) element.id = id
  if (className) element.className = className
  if (data) element.setAttribute("data-value", data)
  return parent.appendChild(element)
}

export function createAndAppendStyle(
  styleSheet: string,
  parent: Node,
  id: string
): HTMLStyleElement {
  const element = document.createElement("style")
  element.textContent = styleSheet
  element.id = id
  return parent.appendChild(element)
}
