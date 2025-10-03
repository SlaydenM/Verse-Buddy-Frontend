"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatReference } from "@/lib/bible-utils"
import { initAlignment } from '@/public/alignmentOLD'
import type { BibleReference } from "@/types/bible"
import { ChevronUp, Mic, MicOff } from "lucide-react"
import { useEffect, useRef, useState } from 'react'
import { createRoot } from "react-dom/client"

import { sendCurrentUnrecognized, startTranscription, stopTranscription } from "@/public/audio-client"
// import "@/styles/alignment.css"
import React from "react"
import { Token, Cursor, useStore, store } from "@/public/store"
import { showNextWord, updatePassage } from "@/public/alignment"
import { shallow } from 'zustand/shallow';

interface QuizSpeakProps {
  reference: BibleReference
}

export const getTextTokens = (text: string): { word: string, separator: string }[] => {
  // let words: string[] = [];
  // let separators: string[] = [];
  
  const wordRegex = /[a-zA-Z'_]+/g;
  const tokens = []
  let lastMatch = ""
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  while ((match = wordRegex.exec(text)) !== null) {
    // separators.push(text.slice(lastIndex, match.index));
    // words.push(match[0]);
    tokens.push({
      word: lastMatch,
      separator: text.slice(lastIndex, match.index)
    })
    lastMatch = match[0]
    lastIndex = match.index + match[0].length;
  }
  tokens.push({ // Last token
    word: lastMatch,
    separator: text.slice(lastIndex)
  })
  
  return tokens;
};

export const generatePassage = (reference: BibleReference): Token[][] => {
  return reference.text.map((verse: string) => {
    const tokens = getTextTokens(verse);
    
    return tokens.map((t, j) => (
      {
        display: t.word,
        word: t.word.toLowerCase(),
        separator: t.separator,
        state: (j === 0) ? "C" : null,
        order: true,
        temp: false
      } as Token
    ))
  });
}

export function QuizSpeak({ reference }: QuizSpeakProps) {
  const setPassage = useStore(s => s.setPassage);
  
  const output = useStore(s => s.output);
  const setOutput = useStore(s => s.setOutput);
  
  const cursorIdx = useStore(s => s.cursorIdx);
  const transcribing = useStore(s => s.transcribing);
  const editableRef = useRef<HTMLDivElement>(null);
  
  // const [transcribing, setTranscribing] = useState<boolean>(false)
  // const subRecsRef = useRef<Map<string, any>>(new Map())
  // const socketRef = useRef<WebSocket | null>(null);
  // const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  // const audioContextRef = useRef<AudioContext | null>(null);
  // const audioStreamRef = useRef<MediaStream | null>(null);
  
  // const passageRef = useRef(passage);
  
  // const targetContent = reference ? reference.text.join('') : '';

  
  // Initialize with mic icon
  // useEffect(() => {
  //   if (editableRef.current && editableRef.current.innerHTML.trim() === "") {
  //     editableRef.current.innerHTML = `<span contenteditable="false">🎤</span> `;
  //   }
  // }, []);
  
  // const handleInput = () => {
  //   if (editableRef.current) {
  //     // Get text *without* the mic icon
  //     const text = editableRef.current.innerText.replace("🎤", "").trim();
  //     setOutput(text);
  //   }
  // };

  // const handleBeforeInput = (e: React.FormEvent<HTMLDivElement> & { data?: string }) => {
  //   // Prevent deletion of the mic icon
  //   const sel = window.getSelection();
  //   if (!sel) return;
    
  //   const node = sel.anchorNode as Node;
  //   if (node && node.parentElement?.getAttribute("contenteditable") === "false") {
  //     e.preventDefault();
  //   }
  // };
  
  
  const updateCursorIcon = () => {
    const cursorEls = document.querySelectorAll<HTMLElement>(".cursor");
    
    cursorEls.forEach((el) => {
      // Avoid duplicating if already added
      if (el.querySelector(".text-cursor-icon")) return;
      
      const container = document.createElement("span");
      container.className = "text-cursor-icon";
      el.appendChild(container);
      
      const root = createRoot(container);
      root.render(<ChevronUp size={14} />);
    });
  }
  
  const capitalizeNames = (str: string): string => {
    const capFirst = (str: string) => str[0] + str.slice(1)
    
    const words = str.split(" ")
    const names = ["god", "lord", "jesus", "christ"]
    
    return words.map((w, i) => {
      if (i == 0 || names.includes(w))
        return capFirst(w)
    }).join(" ")
  }
  
  const handleStart = () => {
    store.passageBuffer = useStore.getState().passage; // Initialize buffer
    startTranscription()
  }
  
  const handleStop = () => {
    stopTranscription()
  }
  const [i, setI] = useState(0)
  const handleClear = () => {
    handleStop();
    setOutput(<span></span>);
    // console.log("C")
    
    const clearedPassage = useStore.getState().passage.map((verse: Token[]) => ( // Fill passage
      verse.map((token: Token) => (
        {
          ...token,
          state: null,
          order: false,
          temp: false,
        } as Token
      ))
    ))
    store.passageBuffer = clearedPassage // Update buffer
    setPassage(clearedPassage)
    setI(0)
    store.lastUserWordsChunk = [];
    store.currentUnrecognized = [];
    // setPassage(p => updatePassage(["as", "dear", "children"], p))
    // setPassage(newPassage);
    // setTimeout(() => {
    //   setPassage(p => updatePassage(["paul", "an", "purchased"], p));
    // }, 1000);
    // subRecsRef.current = new Map()
    // console.log(mergeSyllables(subRecsRef.current as any, alignmentResponse.targetTokens, ["unclean", "ness"]))//, "l"
    //["corn", "fil", "thin", "fil", "thi", "ness", "par", "akers", "and", "gentiles"]
  }

  const handleNext = () => {
    // showNextWord(store.subRecs)
    
    // const l = "But fornication and all"//"has any inheritance in the kingdom of god and christ"//"therefore be imitators of god"
    // const prevUnrecognized = store.currentUnrecognized;
    // updatePassage(l.split(" "))
    // updatePassage(l.split(" ").slice(0,i+1), true)
    // setI(i + 1)
    setOutput(
      <span className="results">
        <span>
          here are some words that i need to trim up, this is the first test.
        </span>
      </span>
    )
    
    // sendCurrentUnrecognized(prevUnrecognized) // Update vocabulary 
  }
  
  useEffect(() => {
    console.log("load")
    // Reset targetWords
    const targetWords = [] as string[];
    const initPassage = generatePassage(reference)
    setPassage(initPassage) // useStore.getState().passage is always a fresh value
    
    console.log("PASSAGE:", initPassage)
    initPassage.forEach((verse) => (
      verse.map((token) => (
        targetWords.push(token.word)
      ))
    ))
    store.targetWords = targetWords
  }, [])
  
  useEffect(updateCursorIcon, [output])
  
  const handleInput = (e: any) => {
    if (divRef.current) {
      const newText = divRef.current.innerText;
      // For now just replace with one plain black segment
      // (later you could re-tokenize to re-apply coloring)
      
      // setSegments([{ text: newText, color: "black" }]);
      setOutput(<span className="results"><span></span>{newText}</span>)
      // e.currentTarget.textContent = "";
      // setPassage(p => )
      updatePassage(newText.split(" "))
    }
  };
  
  // animationUtils.ts
  function slideTrim() {
    const n = 4;

    const classes = document.getElementsByClassName("results")
    if (classes.length !== 1) return;
    const container = classes[0] as HTMLElement;
    if (!container) return;
    
    const userContent = container.innerText;
    const words = userContent.trim().split(/\s+/);
    if (words.length <= n) return; // nothing to trim
    
    const span = container.firstElementChild as HTMLElement;
    if (!span) return;
    
    // Find how far to shift (approx width of removed words)
    const removeWords = words.slice(0, words.length - n);
    const dummy = document.createElement("span");
    dummy.style.visibility = "hidden";
    dummy.style.position = "absolute";
    dummy.style.whiteSpace = "nowrap";
    dummy.textContent = removeWords.join(" ") + " ";
    container.appendChild(dummy);
    
    const shiftAmount = dummy.offsetWidth;
    container.removeChild(dummy);
    
    // Animate shift
    span.style.transition = "transform 0.2s ease-out";
    span.style.transform = `translateX(-${shiftAmount}px)`;
    span.style.position = "absolute";
    
    // After animation, reset transform + trim words
    span.addEventListener(
      "transitionend",
      () => {
        const keptWords = words.slice(-n).join(" ");
        store.userContent = keptWords;
        setOutput(
          <span className="results" style={{ transition: "none", transform: "translateX(0)" }}>
            <span>{keptWords}</span>
          </span>
        );
      },
      { once: true }
    );
  }

  const divRef = useRef<HTMLDivElement>(null);
  
  const formatPassage = (passage: Token[][]) => { // ISSUE: calls repeatedly regardless of change
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
            {verse.map(({ display: word, separator, state }: Token, j) => (
              <React.Fragment key={j}>
                {/* Token and separator */}
                {state === "C" ? (
                  <>
                    <span key={"w" + j} className="text-green-600">{word}</span>
                    <span key={"s" + j}>{separator}</span>
                  </>
                ) : (
                  <>
                    <span key={"w" + j} className={`text-gray-800 ${state === "I" ? "shadow-[inset_0_-1px_0_0_red]" : "shadow-[inset_0_-1px_0_0_darkgray]"}`}>{word}</span>
                    <span key={"s" + j} className={"text-gray-600"}>{separator}</span>
                  </>
                )}
                
                {/* Cursor */}
                {passage[0][0].state !== null && i == cursorIdx.i && j == cursorIdx.j && 
                  <ChevronUp key={cursorIdx.i} size={14} color="lightblue" className="absolute inline ml-[-0.63rem] mt-5" />
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
        <CardTitle>Speak - {formatReference(reference)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <div className="flex gap-2">
            <Button className="py-2 border bg-white" onClick={useStore.getState().transcribing ? handleStop : handleStart}>{transcribing ? "Stop" : "Start"}</Button>
            <Button className="py-2 border bg-white" onClick={handleNext}>Next</Button>
            <Button className="py-2 border bg-white" onClick={handleClear}>Clear</Button>
            <Button className="py-2 border bg-white" onClick={() => slideTrim()}>Trim</Button>
          </div>
          
          {/* User prompt */}
          <div
            id="user-prompt" 
            className="relative flex border-solid rounded min-h-20 m-3 py-3 pr-3 w-auto bg-[#44444f]"
            // onInput={handleInput}
            // onBeforeInput={handleBeforeInput}
          >
            <div className="px-3">
              {transcribing ? <Mic color="#ff5959"/> : <MicOff/>}
            </div>
            {/* {output} */}
            <p
              // ref={divRef}
              id="output-box"
              className="w-full"
              // contentEditable
              // suppressContentEditableWarning
              // onInput={handleInput}
            >
              {useStore.getState().output}
            </p>
            <p
              ref={divRef}
              className="w-full"
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
            >
              {/* {output} */}
            </p>
          </div>
        
          {/* Passage */}
          <p>
            {formatPassage(useStore.getState().passage)}
          </p>
          
          {/* Passage */}
          {/* <p id="target-prompt" hidden>{targetContent}</p>
          <p id="field" className="m-5"></p> */}

          
          
        </div>
      </CardContent>
    </Card>
  )
}
