import type { ForesightElementData } from "js.foresight"

export const sortByDocumentPosition = (a: ForesightElementData, b: ForesightElementData) => {
  const position = a.element.compareDocumentPosition(b.element)
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}
