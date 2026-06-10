// npm has no "all-time" downloads endpoint, only date ranges capped at 18
// months per request, so we fetch in chunks from the first publish and sum.
const NPM_PACKAGE_CREATED = "2025-05-08"

export const fetchAllTimeNpmDownloads = async () => {
  const ranges: string[] = []
  const start = new Date(NPM_PACKAGE_CREATED)
  const today = new Date()
  while (start <= today) {
    const end = new Date(start)
    end.setMonth(end.getMonth() + 17)
    const rangeEnd = end < today ? end : today
    ranges.push(`${start.toISOString().slice(0, 10)}:${rangeEnd.toISOString().slice(0, 10)}`)
    start.setTime(rangeEnd.getTime())
    start.setDate(start.getDate() + 1)
  }

  const results = await Promise.all(
    ranges.map(range =>
      fetch(`https://api.npmjs.org/downloads/point/${range}/js.foresight`).then(res => res.json())
    )
  )
  return results.reduce((total, data) => total + (data.downloads || 0), 0)
}
