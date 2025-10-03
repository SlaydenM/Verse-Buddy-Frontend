"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BibleReference } from "@/types/bible"
import { formatReference } from "@/lib/bible-utils"
// import { getTextTokens } from "./passage"

import { useEffect, useRef, useState } from "react"
import { ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import React from "react"
import { getTextTokens } from "./quiz-speak"
import { State } from "@/public/store"

interface QuizTypeProps {
  reference: BibleReference
}

interface Token {
  word: string,
  separator: string,
  state: State
}

function generatePassage(reference: BibleReference): Token[][] {
  return reference.text.map((verse: string) => {
    const tokens = getTextTokens(verse);
        
    return tokens.map((t, j) => (
      {
        ...t,
        state: (j === 0) ? "C" : null
      } as Token
    ))
    
    // Fill words
    // const wordsArr = tokens.words.map((word: string, j) => ({
    //   word,
    //   separator: tokens.separators[j + 1],
    //   state: null,
    // } as Token));
    
    // // Add filler in first position
    // wordsArr.unshift({
    //   word: "",
    //   separator: tokens.separators[0],
    //   state: "C",
    // } as Token);
    
    // return wordsArr;
  });
}

export function QuizType({ reference }: QuizTypeProps) {  
  const cursorIdxRef = useRef({ i: 0, j: 0 })
  const [passage, setPassage] = useState<Token[][]>(() => generatePassage(reference))
  const passageRef = useRef(passage);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const letter = e.key.toLowerCase();
      if (!/^[a-zA-Z]$/.test(letter)) return;
      
      passageRef.current.some((verse, i) => {
        cursorIdxRef.current = { i, j: verse.findIndex((w) => w.state !== "C") };
        return cursorIdxRef.current.j !== -1
      });
      
      console.log(cursorIdxRef.current)
      
      const word = passageRef.current[cursorIdxRef.current.i][cursorIdxRef.current.j].word;
      console.log(word[0].toLowerCase(), letter)
      const newPassage = passageRef.current.map((verse) =>
        verse.map((word) => ({ ...word })) // deep copy
      );
      newPassage[cursorIdxRef.current.i][cursorIdxRef.current.j].state = (word[0].toLowerCase() === letter) ? "C" : "I";
      setPassage(newPassage);
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reference]);
  
  useEffect(() => {
    passageRef.current = passage;
  }, [passage]);
  
  const showNextWord = () => {
    if (cursorIdxRef.current.i >= passage.length && cursorIdxRef.current.j >= passage[cursorIdxRef.current.i].length)
      return
    
    passage.some((verse, i) => {
      cursorIdxRef.current = { i, j: verse.findIndex((w) => w.state !== "C") };
      return cursorIdxRef.current.j !== -1
    });

    const newPassage = passage.map((verse) =>
      verse.map((word) => ({ ...word })) // deep copy
    );
    newPassage[cursorIdxRef.current.i][cursorIdxRef.current.j].state = "C";
    setPassage(newPassage);
  }
  
  const resetPassage = () => {
    cursorIdxRef.current = { i: 0, j: 0 }
    setPassage(generatePassage(reference)); // triggers full re-render with new data
  }
  
  const formatPassage = () => {
    const headingKeys = (reference.headings) ? Object.keys(reference.headings) : []
    return passage.map((verse: Token[], i) => {
      const startsWithNewline = verse.length && verse[0].separator.includes("\n");
      
      return (
        <span key={i}>
          {/* Heading */}
          {headingKeys.includes("" + (i + 1))
            ? (
              <span key={`h${i + 1}`} className="block py-3 text-xl font-bold">
                {reference.headings[i + 1]}
              </span>
            ) : startsWithNewline && <br />
          }
          
          {/* Verse */}
          <span key={`v${i}`} style={startsWithNewline ? { marginLeft: "1rem" } : {}} className="mb-2">
            {/* Number */}
            <span className="px-[0.15rem] text-xs text-gray-400 align-super">{i + 1}</span>
            
            {/* Lines */}
            {verse.map(({ word, separator, state }: Token, j) => (
              <React.Fragment key={j}>
                {/* Word and separator */}
                {state === "C" ? (
                  <>
                    <span key={"w" + j} className="text-green-600">{word}</span>
                    <span key={"s" + j}>{separator}</span>
                  </>
                ) : (
                  <>
                    <span key={"w" + j} className={`text-transparent ${state === "I" ? "shadow-[inset_0_-1px_0_0_red]" : "shadow-[inset_0_-1px_0_0_darkgray]"}`}>{word}</span>
                    <span key={"s" + j} className={"text-gray-600"}>{separator}</span>
                  </>
                )}

                {/* Cursor */}
                {passage[0][0].state !== null && i == cursorIdxRef.current.i && j == cursorIdxRef.current.j && 
                  <ChevronUp key={cursorIdxRef.current.i} size={14} color="lightblue" className="absolute inline ml-[-0.63rem] mt-5" />
                }
                
                {/* Line break */}
                {j > 0 && separator.includes("\n") && (
                  <><br/><span style={{marginLeft: "1rem"}}/></>
                )}
              </React.Fragment>
            ))}
          </span>
        </span>
      );
    })
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Type - {formatReference(reference)}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Buttons */}
        <div className="flex gap-2">
          <Button onClick={showNextWord} className="py-2 border bg-white">Next</Button>
          <Button onClick={resetPassage} className="py-2 border bg-white">Clear</Button>
        </div>
        
        {/* Passage */}
        <p>
          {formatPassage()}
        </p>
      </CardContent>
    </Card>
  )
}
