import { State, store, Token } from "./store";

const argFact = (compareFn: any) => (array: any[]) => array.map((el, idx) => [el, idx]).reduce(compareFn)[1];
const argMin = argFact((max: any, el: any) => (el[0] < max[0] ? el : max));

const fetchHomonyms = async (): Promise<string[]> => {
  try {
    const response = await fetch('./homonyms.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const homonyms = await response.json();
    return homonyms;
  } catch (error) {
    console.error("Failed to load homonyms:", error);
    return [];
  }
};

let cursorIdx = 0;
const matchOverrides = new Set<number>();
let homonyms: string[] = [];
fetchHomonyms().then((h) => { homonyms = h; });

function areHomonyms(a: string, b: string): boolean {
  return homonyms.some(set => set.includes(a) && set.includes(b));
}

const getFuzzyThreshold = (word: string): number => {
  return Math.max(2, Math.ceil(word.length * 0.30)); // At least 2, or 30% of the word length
};

export const levenshtein = (a: string | string[], b: string | string[]): number => {
  const dp: number[][] = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));
  
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1.5
        );
      }
    }
  }
  
  return dp[a.length][b.length];
};

// ---SHOW NEXT WORD----------------------------
export const showNextWord = (subRecs: Map<string, string[]>): void => {
  matchOverrides.add(cursorIdx + 1);
  // updatePassage();
};

// ---UPDATE PASSAGE----------------------------
export const updatePassage = (
  userWords: string[], 
  setCursorIdx: React.Dispatch<React.SetStateAction<{ i: number, j: number }>>, 
  partial: boolean = true
) => {
  const passage: Token[][] = store.passageBuffer // Load storage into current passage
  
  const targetWords: string[] = [], matches: State[] = [], order: boolean[] = []
  // console.log("call updatePassage", userWords)
  if (userWords.length === 0) {
    console.log("BLANK")
    return passage
  }
  
  // Cross map matches and order into individual arrays
  passage.forEach((verse) => (
    verse.forEach((token) => {
      targetWords.push(token.word);
      matches.push(token.state);
      order.push(token.order);
    })
  ))
  
  // Process matches
  const { matches: newMatches, order: newOrder } = updateMatches(userWords, matches, order)
  
  // Remap matches and order to passage
  let k = -1
  const newPassage = passage.map((verse) => (
    verse.map((token) => {
      k++
      return {
        ...token,
        state: (token.state === "C") ? "C" : newMatches[k], // Only consider previously non-correct matches !partial && 
        order: newOrder[k],
        temp: partial && (token.temp || (token.state !== newMatches[k] || token.order !== newOrder[k]))
      }
    })
  ))
  
  // Update cursor
  setCursorIdx((c: any) => updateCursor(passage, c))
  
  if (!partial) {
    store.passageBuffer = newPassage // Update buffer on result
    console.log("UPDATED BUFFER")
  }
  
  // console.log(newPassage)
  return newPassage
}

// ---UPDATE MATCHES----------------------------
const updateMatches = (
  userWords: string[],
  matches: State[], 
  order: boolean[]
) => {
  console.log("call updateMatches:")
  
  // Initialize match data for user words
  const userWordMatches: number[][] = Array(userWords.length)
    .fill(null)
    .map(() => []);
  
  // Find all correct matches between userWords and targetWords
  const userWordsSplitters = findMatches(userWords, userWordMatches, matches, order)
  
  // Track all unrecognized words worth considering
  updateCurrentUnrecognized(matches)
  
  // Split userWords into chunks at each splitter index
  const userWordsChunks = splitUserWords(userWords, userWordsSplitters);
  
  // Match chunks with targetWords
  userWordsChunks.map((userWordsChunk, i) => {
    processChunk(userWordsChunk, matches, order)
  });
  
  return { matches, order }
}

// ---FIND MATCHES----------------------------
const findMatches = (
  userWords: string[], 
  userWordMatches: number[][], 
  matches: State[], 
  order: boolean[]
) => {
  console.log("call findMatches:")
  
  const userWordsSplitters: number[] = [];
  let prevUnrecognizedIdx = 0;
  // const fuzzyThreshold = 2; // Levenshtein distance to be considered correct
  const splitThreshold = 3; // Forward distance between correct matches to be considered outliers
  const levens: number[][] = Array(userWords.length).fill(null).map(() => Array(store.targetWords.length).fill(0)); // Track levenshtein distances for optimization
  
  // Map any user words with target words
  userWords.map((userWord, i) => {
    // Find all possible matches for the current user word
    store.targetWords.map((targetWord, j) => {
      const fuzzyThreshold = getFuzzyThreshold(targetWord);
      const leven = levenshtein(userWord, targetWord); // Levenshtein distance OR is homonym
      
      // If a match is found
      if (leven <= fuzzyThreshold || areHomonyms(userWord,targetWord)) { 
        matches[j] = "M"; // Update as matched
        userWordMatches[i].push(j); // Update matched user words
        order[j] = order[j] || ( i > 0 && j > 0 && levens[i - 1][j - 1] <= fuzzyThreshold); // Update order
      }
      levens[i][j] = leven; // Store for order checking optimization
      
      // Unrecognized word
      // if (store.subRecs.has(targetWord) && store.subRecs.get(targetWord)?.includes(userWord)) { 
      //   // console.log("NEW UNREC FOUND");
      //   userWordMatches[i].push(j)
      //   prevUnrecognizedIdx = i;
      // }
    });
      
    // console.log(userWordMatches[i].map(currIdx => {
    //     console.log(targetWords[currIdx - 1])
    //     return subRecs.has(targetWords[currIdx - 1])
    // }))
    // console.log("PREV:", prevUnrecognizedIdx, userWordMatches[i])
    
    // Check for outliers
    // console.log(
    //   "outlier check:",
    //   userWord,
    //   i > 0,
    //   userWordMatches[i].length > 0,
    //   i > 0 && userWordMatches[i - 1].length > 0,
    //   i > 0 && !userWordMatches[i].some(currIdx => 
    //     userWordMatches[i - 1].some(prevIdx => 
    //       (currIdx - prevIdx) <= splitThreshold && currIdx > prevIdx // Check if current index is 3 words ahead of previous index
    //     ) 
    //   ),
    //   i > prevUnrecognizedIdx + 2
    // )
    if (
      i > 0 && // First in user words is never an outlier
      userWordMatches[i].length > 0 && // Must be found in targetWords
      userWordMatches[i - 1].length > 0 && // Previous word must be found in targetWords
      !userWordMatches[i].some(currIdx => 
        userWordMatches[i - 1].some(prevIdx => 
          (currIdx - prevIdx) <= splitThreshold && currIdx > prevIdx // Check if current index is 3 words ahead of previous index
        ) 
      ) //&&
      // i > prevUnrecognizedIdx + 2 // Must be positioned considerably after an unrecognized word
    ) {
      userWordsSplitters.push(i); // Track split index
    }
  });
  console.log("US:",userWordsSplitters)
  return userWordsSplitters
}

// ---UPDATE CURRENT UNRECOGNIZED----------------------------
const updateCurrentUnrecognized = (matches: State[]) => {
  let lastCorrectIdx = 0
  
  // Track every unrecognized word: non-correct and within 2 after a correct
  store.currentUnrecognized = []
  store.targetWords.forEach((targetWord, j) => {
    // console.log("C:",store.subRecs.has(targetWord), lastCorrectIdx + 2 > j, lastCorrectIdx, j, matches[j] == "C")
    if (!targetWord) return
    
    // Track correct
    const state = matches[j]
    if (state && ["C", "M"].includes(state))  { // Valid correct/matches word
      // console.log("CHANGE", j)
      lastCorrectIdx = j
      return
    }
    
    // Check criteria
    if (store.subRecs.has(targetWord) && j < lastCorrectIdx + 2) { 
      store.currentUnrecognized.push(targetWord) // Add to list
    }
  })
  console.log("NEW CUR:", store.currentUnrecognized, matches, store.subRecs)
}

// ---PROCESS CHUNK----------------------------
const processChunk = (
  userWordsChunk: string[],
  matches: State[],
  order: boolean[] 
) => {
  console.log("call processChunk:")
  
  // Find levenshtein distance for each window
  const levenshteins = matches.map((state, j) => { // ISSUE: this checks for all matches in targetWords, not just the current chunk
    if (state) { // Not just "M"
      let window = store.targetWords.slice(j, j + userWordsChunk.length); // NOTE: adding +1 to fixes mismatching at the end of targetWords
      if (j + userWordsChunk.length >= store.targetWords.length)
        window = [...window, ""]; // Add end string to better fit chunk to the window
      return levenshtein(userWordsChunk, window) - (window[0] === userWordsChunk[0] ? 1 : 0); // Prefer matches that start with the same word
    } else {
      return Infinity; // Ignore unmatched words
    }
  });
  
  // Process levenshtein distances to find the nearest match
  let nearestMatchLength = Math.ceil(Math.min(...levenshteins)) + 1; // Store the levenshtein distance to size target window
  if (nearestMatchLength === Infinity)
    nearestMatchLength = 0; // No matches found
  const nearestMatchIndex = argMin(levenshteins);
  
  // Initialize slice to be incorrect
  const windowLength: number = userWordsChunk.length + nearestMatchLength; // Local window for matching
  const matchesSlice: State[] = Array(windowLength).fill("I"); // Default all not correct with incorrect matches    (state === "C") ? "C" : 
  
  // Match chunk with window
  matchChunk(userWordsChunk, matchesSlice, order, nearestMatchIndex, windowLength)
  
  // Clip matchesSlice to the last correct match
  const lastCorrectIdx = matchesSlice.lastIndexOf("C");
  const matchesSliceClipped: State[] = lastCorrectIdx !== -1
    ? matchesSlice.slice(0, lastCorrectIdx + 1) // CHANGED
    : matchesSlice.slice();
  
  // Update matches with the new matchesSlice
  matchesSliceClipped.map((state, k) => {
    matches[nearestMatchIndex + k] = state;
  });
}

// ---MATCH CHUNK----------------------------
const matchChunk = (
  userWordsChunk: string[],
  matchesSlice: State[],
  order: boolean[],
  nearestMatchIndex: number,
  windowLength: number
) => {
  console.log(`call matchChunk(${userWordsChunk}, ${matchesSlice}, ${nearestMatchIndex}, ${windowLength}):`)
  
  let p = 0; // Previous index for user words
  userWordsChunk.map((userWord) => {
    store.targetWords.slice(nearestMatchIndex + p, nearestMatchIndex + windowLength).some((targetWord, j, targetSlice) => {
      // console.log(targetWord, (subRecs.has(targetWord)))
      
      // Unrecognized word
      // if (store.subRecs.has(targetWord) && store.subRecs.get(targetWord)?.includes(userWord)) {
      //   // console.log("UNRECOGNIZED");
      //   matchesSlice[j + p] = "C"; // Correct match
        
      //   order[nearestMatchIndex + j + p] = true;
      //   order[nearestMatchIndex + j + p + 1] = true;
      //   p += Math.max(0, j - 1); // Update index
      //   return true // Stop searching when found
      // }
      
      // If match, mark as correct and set as new index for next word, if not, keep going
      const fuzzyThreshold = 2;//getFuzzyThreshold(targetWord);
      const leven = levenshtein(userWord, targetWord)
      // const leven = (homonyms.includes(userWord) && homonyms.includes(targetWord)) ? fuzzyThreshold : levenshtein(userWord, targetWord); // 
      if (leven <= fuzzyThreshold || areHomonyms(userWord, targetWord)) { // && (j == nearestMatchIndex || matches[j - 1] == "I" || userWords[i - 1] == targetWords[j - 1])) { // Levenshtein distance OR is homonym
        matchesSlice[j + p] = "C"; // Correct match
        p += Math.max(0, j - 1); // Update index
        return true // Stop searching when found
      }
      if (j <= 0) return false
      
      // Check for implied, insignificant or unrecognized words
      // if (matchesSlice[j - 1] !== "C" && (targetSlice[j - 1].length <= 2)) {//subRecs.some((u) => u.includes(targetSlice[j - 1]))) { 
      //   matchesSlice[j - 1] = "O"; // Make previous word an implied match
      //   console.log("imp:", targetSlice[j - 1])
      //     order[nearestMatchIndex + p - 1] = true;
      //     order[nearestMatchIndex + p + 1] = true;
      // }
      
      // Unrecognized
      // `console.log(`if ("${matchesSlice[j - 1]}" !== "C" (${matchesSlice[j - 1] !== "C"}) && ${targetSlice[j - 1].length} <= 2 (${targetSlice[j - 1].length <= 2}))`)
      // if (matchesSlice[j - 1] !== "C" && (targetSlice[j - 1].length <= 2 || subRecs.includes(targetSlice[j - 1]))) { // Previous word is incorrect and is 2 or less characters
      // console.log("m?")
      // console.log(subRecs, targetSlice[j - 1])
      // if (subRecs.includes(targetSlice[j - 1])) {//subRecs.some((u) => u.includes(targetSlice[j - 1]))) { 
      //     matchesSlice[j - 1] = "O"; // Make previous word an implied match
      //     console.log("imp:", targetSlice[j - 1])
      //     order[nearestMatchIndex + p - 1] = true;
      //     order[nearestMatchIndex + p + 1] = true;
      // }
    });
  });
}

const updateCursor = (passage: Token[][], cursorIdx: any) => {
  let k = -1
  passage.forEach((verse, i) => (
    verse.forEach((token, j) => {
      if (++k === store.lastUserWordsChunkLastWordIdx) { // Given last word index matches major index 
        cursorIdx = { i, j } // Update position
      }
    })
  ))

  return cursorIdx
}

const splitUserWords = (
  userWords: string[],
  userWordsSplitters: number[]
): string[][] => {
  // console.log("UUU:", userWords, userWordsSplitters)
  // Split userWords into chunks at each splitter index
  let lastIndex = 0;
  const userWordsChunks: string[][] = [];
  userWordsSplitters.map(splitIndex => {
    userWordsChunks.push(userWords.slice(lastIndex, splitIndex));
    lastIndex = splitIndex;
  });
  userWordsChunks.push(userWords.slice(lastIndex)); // Add the last chunk
  
  // Verify chunk sizes
  if (userWordsChunks.length === 1) {
    store.lastUserWordsChunk = userWordsChunks.at(0)/*?.slice(-4)*/ || [] // Keep last 4 spoken words in cache
    store.lastUserWordsChunkLastWordIdx = (userWordsSplitters.at(-1)! + userWordsChunks.at(0)!.length) || 0
    // console.log("L:", store.lastUserWordsChunk, store.lastUserWordsChunkLastWordIdx)
    return userWordsChunks; // If only one chunk, return as is
  }
  userWordsChunks.map((chunk, i) => {
    if (chunk.length < 2) { // If chunk is too small, merge with a neighboring chunk
      if (i > 0)
        userWordsChunks[i - 1] = userWordsChunks[i - 1].concat(userWordsChunks[i]); // Add to previous chunk
      else if (userWordsChunks[i + 1])
        userWordsChunks[i + 1] = userWordsChunks[i].concat(userWordsChunks[i + 1]); // Add to next chunk
      userWordsChunks.splice(i, 1); // Remove the chunk
    }
  });
  
  // Store last chunk data
  // console.log("userWordsChunks:", userWordsChunks);
  if (userWordsChunks.length) { // && userWordsChunks.at(-1)
    store.lastUserWordsChunk = userWordsChunks.at(-1)?.slice(-4) || [] // Keep last 4 spoken words in cache
    store.lastUserWordsChunkLastWordIdx = (userWordsSplitters.at(-1)! + userWordsChunks.at(-1)!.length) || 0
    // console.log("L:", store.lastUserWordsChunk, store.lastUserWordsChunkLastWordIdx)
  }
  // console.log("L:", store.lastUserWordsChunk, store.lastUserWordsChunkLastWordIdx)
  return userWordsChunks;
}
