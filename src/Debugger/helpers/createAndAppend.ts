type attributes = {
  className?: string
  data?: string
  id?: string
}

export function createAndAppendElement(
  tag: string,
  parent: Node,
  attributes: attributes
): HTMLElement {
  const element = document.createElement(tag)
  if (attributes.id) element.id = attributes.id
  if (attributes.className) element.className = attributes.className
  if (attributes.data) element.setAttribute("data-value", attributes.data)
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
