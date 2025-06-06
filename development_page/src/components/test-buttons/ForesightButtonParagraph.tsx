type ForesightButtonParagraphProps = {
  paragraph: string
}

function ForesightButtonParagraph({ paragraph }: ForesightButtonParagraphProps) {
  return <p className="text-sm text-slate-600 text-center max-w-90">{paragraph}</p>
}

export default ForesightButtonParagraph
