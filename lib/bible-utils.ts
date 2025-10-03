import type { BibleReference } from "@/types/bible"

export function formatReference(reference: BibleReference): string {
  const { version, book, chapter, startVerse, endVerse, finalVerse } = reference

  if (startVerse === endVerse) {
    return `${book} ${chapter}:${startVerse} (${version})`
  }
  else if (startVerse === 1 && endVerse === finalVerse) {
    return `${book} ${chapter} (${version})`
  }

  return `${book} ${chapter}:${startVerse}-${endVerse} (${version})`
}
