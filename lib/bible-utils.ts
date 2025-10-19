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

export function formatReferences(references: BibleReference[]): string {
  if (references.length === 0) return "";
  if (references.length === 1) return formatReference(references[0]);
  
  return "All studies";
}
