"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BibleReference } from "@/types/bible"
import { formatReference } from "@/lib/bible-utils"
import { Button } from "@/components/ui/button"
import { Move, CircleDot } from "lucide-react";
import React, { use, useEffect, useRef, useState } from "react";
import { getTextTokens } from "./passage"

interface QuizRevealProps {
  reference: BibleReference
}

interface Word {
  word: string,
  separator: string,
}

function generatePassage(reference: BibleReference): Word[][] {
  return reference.text.map((verse: string, i) => {
    const tokens = getTextTokens(verse);
    
    // Fill words
    const wordsArr = tokens.words.map((word: string, j) => ({
      word,
      separator: tokens.separators[j + 1],
    } as Word));
    
    // Add filler in first position
    wordsArr.unshift({
      word: "",
      separator: tokens.separators[0],
    } as Word);
    
    return wordsArr;
  });
}

export function QuizReveal({ reference }: QuizRevealProps) {
  // Element variables
  const containerRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const verseNumRef = useRef<HTMLDivElement[]>([]);
  const isDraggingRef = useRef(false);
  const lineHeightRef = useRef(50);
  const [passage, setPassage] = useState<Word[][]>(() => generatePassage(reference))
  
  // Position variables
  const dragPos = useRef({
    x: 0,
    y: 0
  });
  const initialPos = useRef({
    x: 0,
    y: 0
  });
  const coverPos = useRef({
    word: null as HTMLSpanElement | null,
    x: 0,
    y: 0,
  });
  const padding = useRef({
    x: 12,
    y: 12
  })
  
  // Styling constants
  const snapOffset = { x: 3, y: 3}; // px
  const borderRadius = 8; // px
  let prevY = 0;
  
  const formatPassage = () => {
    const headingKeys = (reference.headings) ? Object.keys(reference.headings) : []
    return passage.map((verse: Word[], i) => {
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
          <span key={`v${i}`} style={startsWithNewline ? { marginLeft: "1rem" } : {}} className="verse mb-2">
            {/* Number */}
            <span className="verseNum transition-opacity duration-0 ease-[steps(1,end)] opacity-100 px-[0.15rem] text-xs text-gray-400 align-super">{i + 1}</span>
            
            {/* Lines */}
            {verse.map(({ word, separator }: Word, j) => (
              <React.Fragment key={j}>
                {/* Word and separator */}
                {word && <span className={`word inline-block relative z-[1] ${separator === "-" ? "" : "mr-1"}`}>
                  {word}{separator}
                </span>}
                
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
  
  // Update line height
  useEffect(() => {
    const container = containerRef.current
    if (!container) return;
    
    const words = Array.from(container.querySelectorAll<HTMLElement>(".word"));
    if (words.length < 2) {
      lineHeightRef.current = 50; // fallback if only 1 word
      return;
    }
    
    const firstTop = words[0].offsetTop;
    let secondTop: number | null = null;
    
    for (let i = 2; i < words.length; i++) {
      const currentTop = words[i].offsetTop;
      if (currentTop > firstTop + 2) { // allow for subpixel rounding
        secondTop = currentTop;
        break;
      }
    }
    
    if (secondTop !== null) {
      lineHeightRef.current = secondTop - firstTop;
      // console.log("Line Height:", lineHeightRef.current)
    }
  }, []);
  
  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }
  
  function setCoverPos(elem: HTMLSpanElement) {
    coverPos.current = {
      word: elem,
      x: elem.offsetLeft + elem.offsetWidth, // OffsetRight
      y: elem.offsetTop
    };
    return coverPos.current;
  }
  
  function snapToWord(x: number, y: number) {
    let closestDistance = Infinity;
    const wordElements = Array.from(coverRef.current!.querySelectorAll(".word")) as HTMLSpanElement[];
    wordElements.filter(word => Math.abs(word.offsetTop - y) < lineHeightRef.current * 2)
      .forEach(word => {
        const wordX = word.offsetLeft + word.offsetWidth
        const wordY = word.offsetTop
        const distance = Math.sqrt((wordX - x) ** 2 + 3*(wordY - y) ** 2)
        
        if (distance < closestDistance) {
          closestDistance = distance;
          setCoverPos(word);
        }
      });
    
    return coverPos.current;
  }
  
  function handleDrag() {
    // Update position based on drag position
    const { x, y } = snapToWord(dragPos.current.x, dragPos.current.y);
    updateCover(x, y); // Update visual cover

    /*
    const marker = document.getElementById("red-x-marker") as HTMLDivElement | null;
    if (!marker) {
      const newMarker = document.createElement("div");
      newMarker.id = "red-x-marker";
      newMarker.style.position = "absolute";
      newMarker.style.left = `${x}px`;
      newMarker.style.top = `${y}px`;
      newMarker.style.color = "red";
      newMarker.style.fontWeight = "bold";
      newMarker.style.fontSize = "24px";
      newMarker.style.pointerEvents = "none";
      newMarker.innerText = "×";
      newMarker.style.zIndex = "100";
      coverRef?.current?.appendChild(newMarker);
    } else {
      marker.style.left = `${x}px`;
      marker.style.top = `${y}px`;
    }

    
    const marker2 = document.getElementById("red-o-marker") as HTMLDivElement | null;
    if (!marker2) {
      const newMarker = document.createElement("div");
      newMarker.id = "red-o-marker";
      newMarker.style.position = "absolute";
      newMarker.style.left = `${dragPos.current.x}px`;
      newMarker.style.top = `${dragPos.current.y}px`;
      newMarker.style.color = "yellow";
      newMarker.style.fontWeight = "bold";
      newMarker.style.fontSize = "24px";
      newMarker.style.pointerEvents = "none";
      newMarker.innerText = "o";
      newMarker.style.zIndex = "100";
      coverRef?.current?.appendChild(newMarker);
    } else {
      marker2.style.left = `${dragPos.current.x}px`;
      marker2.style.top = `${dragPos.current.y}px`;
    }//*/
  }
  
  function updateCover(x: number, y: number) {
    const cover = coverRef.current!;
    const dragHandle = dragHandleRef.current!;
    const lh = lineHeightRef.current + snapOffset.y;
    
    // Contain position
    x = clamp(x, padding.current.x, cover.offsetWidth - dragHandle.offsetWidth * 1.1 - padding.current.x);
    y = clamp(y, padding.current.y, cover.offsetHeight - dragHandle.offsetHeight - padding.current.y);
    
    // Add offsets
    x += snapOffset.x // Padding right of text
    // y -= snapOffset.y // Padding underneath text
    let nextWord = coverPos.current.word?.nextElementSibling as HTMLSpanElement | null;
    if (!nextWord) {
      x += 15;
    }
    
    // Radius variables
    const br = borderRadius
    const i = br/2.0, ii = br*Math.sqrt(2)/2.0, iii = br*Math.sqrt(3)/2.0
    const ip = i - br, iip = ii - br, iiip = iii - br
    const w = cover.offsetWidth + 1
    
    // ${/*${x}px ${y}px,*/""}
    // ${/*${x}px ${y + lineHeight}px,*/""}
    // ${/*0% ${y + lineHeight}px*/""}
    
    cover.style.clipPath = `polygon(
      -1px ${y + lh}px,
      -1px 0px,
      ${w}px 0px,
      
      ${w}px ${y + br}px,
      ${w + iiip}px ${y - ip}px,
      ${w + iip}px ${y - iip}px,
      ${w + ip}px ${y - iiip}px,
      ${w - br}px ${y}px,
      
      ${x + br}px ${y}px,
      ${x + br - i}px ${y + br - iii}px,
      ${x + br - ii}px ${y + br - ii}px,
      ${x + br - iii}px ${y + br - i}px,
      ${x}px ${y + br}px,
      
      ${x}px ${y + lh - br}px,
      ${x + iiip}px ${y + lh + ip}px,
      ${x + iip}px ${y + lh + iip}px,
      ${x + ip}px ${y + lh + iiip}px,
      ${x - br}px ${y + lh}px
      
      ${x > 1 && `,
        ${br}px ${y + lh}px,
        ${br - i}px ${y + lh - iiip}px,
        ${br - ii}px ${y + lh - iip}px,
        ${br - iii}px ${y + lh - ip}px,
        ${0}px ${y + lh + br}px
      `}
    )`;
    
    if (x + dragHandle.offsetWidth > w) {
      y += lh;
    }
    
    dragHandle.style.transform = `translate(${x}px, ${y}px)`;
    
    // Update verse nums if hidden by cover
    if (prevY != y) { // When y changes
      verseNumRef.current.forEach((el: HTMLDivElement) => {
        if (el.offsetTop > y + 5) {
          el.classList.remove("opacity-100", "duration-0");
          el.classList.add("opacity-0", "duration-200");
        } else {
          el.classList.remove("opacity-0", "duration-200");
          el.classList.add("opacity-100", "duration-0");
        }
      });
      prevY = y;
    }
  }
  
  function nextWord() {
    const currentWord = coverPos.current.word;
    if (!currentWord) return;
    
    const nextVerse = currentWord.parentElement?.parentElement?.nextElementSibling?.getElementsByClassName("verse")[0];
    let nextWord = currentWord.nextElementSibling as HTMLSpanElement | null;
    if (!nextWord) {
      if (nextVerse) nextWord = nextVerse.getElementsByClassName("word")[0] as HTMLSpanElement
      else return
    }
    
    const {x, y} = setCoverPos(nextWord)
    updateCover(x, y);
  }
  
  function nextVerse() {
    const currentWord = coverPos.current.word;
    if (!currentWord) return;
    
    const nextVerse = currentWord.parentElement?.parentElement?.nextElementSibling?.lastElementChild;
    
    const nextWord = (nextVerse && currentWord === currentWord.parentElement?.lastElementChild)
      ? nextVerse.lastElementChild as HTMLSpanElement
      : currentWord.parentElement?.lastElementChild as HTMLSpanElement
    
    const {x, y} = setCoverPos(nextWord)
    updateCover(x, y);
  }
  
  useEffect(() => {
    const cover = coverRef.current!;
    const dragHandle = dragHandleRef.current!;
    const word = cover.querySelector(".word") as HTMLSpanElement;
    verseNumRef.current = Array.from(cover.querySelectorAll<HTMLDivElement>(".verseNum"))
    
    setCoverPos(word);
    handleDrag();
    dragHandle.style.cursor = "grab";
    
    // Update padding
    const style = window.getComputedStyle(cover);
    padding.current = {
      x: parseFloat(style.paddingLeft) || 12,
      y: parseFloat(style.paddingTop) || 12
    }
    
    function handleMouseDown(e: MouseEvent) {
      // console.log("mouse down");
      isDraggingRef.current = true;
      dragHandle.style.cursor = "grabbing";
      
      console.log("Word on down: ", coverPos.current.x, coverPos.current.y)
      // Set initial absolute position
      initialPos.current = {
        x: e.clientX + window.scrollX - coverPos.current.x,
        y: e.clientY + window.scrollY - coverPos.current.y
      }
      
      // Trigger handleDrag immediately on mousedown
      handleMouseMove(e);
    }
    
    function handleMouseMove(e: MouseEvent) {
      // console.log("move")
      if (!isDraggingRef.current) return;
      
      // Subtract the new position with the initial, add to coverPos to find pos relative to first word
      dragPos.current = {
        x: (e.clientX + window.scrollX) - initialPos.current.x, // + coverPos.current.x
        y: (e.clientY + window.scrollY) - initialPos.current.y// + coverPos.current.y
      }
      // console.log("DRAG: ", dragPos.current.x, dragPos.current.y)
      handleDrag();
    }
    
    function handleMouseUp() {
      // console.log("mouse up")
      if (!isDraggingRef.current) return
      
      isDraggingRef.current = false;
      dragHandle.style.cursor = "grab";
      handleDrag();
    }
    
    dragHandle.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    
    return () => { // Prevent useEffect running twice
      dragHandle.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reveal - {formatReference(reference)}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Buttons */}
        <div className="flex gap-2">
          <Button onClick={nextWord} className="py-2 border bg-white">Next Word</Button>
          <Button onClick={nextVerse} className="py-2 border bg-white">Next Verse</Button>
        </div>
        
        {/* Passage */}
        <div ref={containerRef} className="relative select-none">
          <div className="relative bg-[#44444f] min-h-[50vh] p-0 m-0" style={{ borderRadius: `${borderRadius}px`/*, background: "repeating-linear-gradient(-32deg, #6b6b6b, #5f5f5fff 25%, #6b6b6b 50%)"*/ }}>
            <div ref={coverRef} className="cover inset-0 m-0 p-2 pb-4 ease-out duration-100" style={{backgroundColor: "hsl(var(--background))"}}>
              <p>
              {formatPassage()}
              </p>
            </div>
            
            <div ref={dragHandleRef} className={`drag-handle text-white absolute top-0 left-0 z-10 ease-out duration-100 px-1 py-1`}>
              {isDraggingRef.current
                ? <CircleDot/>
                : <Move/>
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}