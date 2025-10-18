import { Move } from "lucide-react";
import { Button } from "react-day-picker";

export const wordRegex = /[a-zA-Z'_]+/g;
  
export const getTextTokens = (text: string) => {
  // Match words (letters, hyphens, apostrophes) or anything else (including spaces, punctuation, line breaks)
  
  let words = [];
  let separators = [];
  let lastIndex = 0;
  let match;
  
  while ((match = wordRegex.exec(text)) !== null) {
      // Separator is from lastIndex to match.index
      separators.push(text.slice(lastIndex, match.index));
      words.push(match[0]);
      lastIndex = match.index + match[0].length;
  }
  // Add trailing separator (after last word)
  separators.push(text.slice(lastIndex));
  return { words, separators };
};
//<span className="px-[0.15rem] text-xs text-gray-400 align-super">{index + 1}</span>
export const formatPassage = (text: string[]) => {
  return <p>{text.map(formatVerse)}</p>
}

const formatVerse = (verse: string, index: number) => {
  const tokens = getTextTokens(verse);
  const length = tokens.separators.length - 1;
  console.log(tokens)

  return (
    <>
      <span className="verseNum transition-opacity duration-0 ease-[steps(1,end)] opacity-100 px-[0.15rem] text-xs text-gray-400 align-super">{index + 1}</span>
      <span key={index} className="verse mb-2">
        {tokens.words.map((word: string, i) => {
          const sep = tokens.separators[Math.min(i + 1, length)];
          return (
            <span key={i} className={`word inline-block relative z-[1] ${sep === "-" ? "" : "mr-1"}`}>
              {word}{sep}
            </span>
          )
        })}
      </span>
    </>
  )
};
