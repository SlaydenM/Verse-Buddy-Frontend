import type { BibleReference, BibleVerse } from "@/types/bible"

// This is a mock API for demonstration purposes
// In a real app, you would connect to an actual Bible API
export async function fetchVerses(reference: BibleReference): Promise<BibleVerse[]> {
  console.log("API called with reference:", reference)

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 400))

  // Mock data for demonstration
  const mockVerses: Record<string, Record<number, Record<number, string>>> = {
    Genesis: {
      1: {
        1: "In the beginning God created the heaven and the earth.",
        2: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.",
        3: "And God said, Let there be light: and there was light.",
        4: "And God saw the light, that it was good: and God divided the light from the darkness.",
        5: "And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.",
        6: "And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.",
        7: "And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.",
        8: "And God called the firmament Heaven. And the evening and the morning were the second day.",
        9: "And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.",
        10: "And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.",
        11: "And God said, Let the earth bring forth grass, the herb yielding seed, and the fruit tree yielding fruit after his kind, whose seed is in itself, upon the earth: and it was so.",
        12: "And the earth brought forth grass, and herb yielding seed after his kind, and the tree yielding fruit, whose seed was in itself, after his kind: and God saw that it was good.",
        13: "And the evening and the morning were the third day.",
        14: "And God said, Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years:",
        15: "And let them be for lights in the firmament of the heaven to give light upon the earth: and it was so.",
        16: "And God made two great lights; the greater light to rule the day, and the lesser light to rule the night: he made the stars also.",
        17: "And God set them in the firmament of the heaven to give light upon the earth,",
        18: "And to rule over the day and over the night, and to divide the light from the darkness: and God saw that it was good.",
        19: "And the evening and the morning were the fourth day.",
        20: "And God said, Let the waters bring forth abundantly the moving creature that hath life, and fowl that may fly above the earth in the open firmament of heaven."
      },
    },
    John: {
      3: {
        16: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
        17: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved.",
        18: "He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.",
        19: "And this is the condemnation, that light is come into the world, and men loved darkness rather than light, because their deeds were evil.",
        20: "For every one that doeth evil hateth the light, neither cometh to the light, lest his deeds should be reproved.",
      },
    },
    Psalms: {
      23: {
        1: "The LORD is my shepherd; I shall not want.",
        2: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
        3: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.",
        4: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.",
        5: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.",
        6: "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.",
      },
    },
    Matthew: {
      5: {
        1: "And seeing the multitudes, he went up into a mountain: and when he was set, his disciples came unto him:",
        2: "And he opened his mouth, and taught them, saying,",
        3: "Blessed are the poor in spirit: for theirs is the kingdom of heaven.",
        4: "Blessed are they that mourn: for they shall be comforted.",
        5: "Blessed are the meek: for they shall inherit the earth.",
        6: "Blessed are they which do hunger and thirst after righteousness: for they shall be filled.",
        7: "Blessed are the merciful: for they shall obtain mercy.",
        8: "Blessed are the pure in heart: for they shall see God.",
        9: "Blessed are the peacemakers: for they shall be called the children of God.",
        10: "Blessed are they which are persecuted for righteousness' sake: for theirs is the kingdom of heaven.",
      },
    },
  }

  // Check if we have mock data for this reference
  if (!mockVerses[reference.book] || !mockVerses[reference.book][reference.chapter]) {
    console.log("No mock data found, generating placeholder verses")
    // If not, generate some placeholder verses
    const placeholderVerses = Array.from({ length: 10 }, (_, i) => ({
      verse: i + 1,
      text: `This is a placeholder for ${reference.book} ${reference.chapter}:${i + 1} in the ${reference.version} version.`,
    }))
    console.log("Generated placeholder verses:", placeholderVerses)
    return placeholderVerses
  }

  // Return the requested verses
  const verses: BibleVerse[] = []
  const chapterVerses = mockVerses[reference.book][reference.chapter]

  // Get all verse numbers in the chapter
  const verseNumbers = Object.keys(chapterVerses)
    .map(Number)
    .sort((a, b) => a - b)

  // Add all verses in the chapter
  for (const verseNum of verseNumbers) {
    verses.push({
      verse: verseNum,
      text: chapterVerses[verseNum],
    })
  }

  console.log("Returning verses from mock data:", verses)
  return verses
}
