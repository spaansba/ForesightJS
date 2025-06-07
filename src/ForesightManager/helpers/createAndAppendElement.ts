export function createAndAppendElement(
  tag: string,
  parent: Node,
  className?: string,
  id?: string
): HTMLElement {
  const element = document.createElement(tag)
  if (id) element.id = id
  if (className) element.className = className
  parent.appendChild(element)
  return element
}
