export const formatDreamDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dreamDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - dreamDay.getTime()) / (1000 * 3600 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' })
  }

  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' }
  if (date.getFullYear() !== now.getFullYear()) {
    opts.year = 'numeric'
  }
  return date.toLocaleDateString(undefined, opts)
}

export const getExcerpt = (content: string, maxLength = 140): string => {
  const text = content.trim().replace(/\s+/g, ' ')
  if (text.length <= maxLength) return text

  const cut = text.slice(0, maxLength)
  const lastPunct = Math.max(
    cut.lastIndexOf('.'),
    cut.lastIndexOf('!'),
    cut.lastIndexOf('?')
  )

  if (lastPunct > 70) {
    return cut.slice(0, lastPunct + 1).trim()
  }
  return cut.trim() + '…'
}
