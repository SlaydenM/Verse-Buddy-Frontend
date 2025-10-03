"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatReference } from "@/lib/bible-utils"
import { initAlignment } from '@/public/alignmentOLD'
import type { BibleReference } from "@/types/bible"
import { ChevronUp, Mic, MicOff } from "lucide-react"
import { useEffect, useRef, useState } from 'react'
import { createRoot } from "react-dom/client"

import "@/styles/alignment.css"

interface alignmentResponseDto {
  updateDisplay: any, 
  showNextWord: any, 
  targetWords: string[]
}

interface Group {
  unRec: string;
  syllables: string[];
  index: number;
}

interface QuizSpeakProps {
  reference: BibleReference
}

export function QuizSpeak({ reference }: QuizSpeakProps) {
  const [output, setOutput] = useState(<span></span>);
  const [alignmentResponse, setAlignmentResponse] = useState<alignmentResponseDto>({ updateDisplay: (subRecs: any) => {}, showNextWord: (subRecs: any) => {}, targetWords: [] })
  const [transcribing, setTranscribing] = useState<boolean>(false)
  const subRecsRef = useRef<Map<string, any>>(new Map())
  const socketRef = useRef<WebSocket | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  
  const targetContent = reference ? reference.text.join('') : '';
  
  const jsonToMap = (jsonStr: string): Map<string, any> => {
    const obj = JSON.parse(jsonStr);
    return new Map(Object.entries(obj));
  }

  const levenshtein = (a: string | string[], b: string | string[]): number => {
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
  
  const applyUnRecReplacements = (lastChunk: string[], groups: Group[]): string[] => {
    // Make a copy to not mutate the original array
    const updated = [...lastChunk];
    
    // Sort groups in reverse order of index to avoid offset issues
    const sortedGroups = [...groups].sort((a, b) => b.index - a.index);
    
    for (const group of sortedGroups) {
      const { index, syllables, unRec } = group;
      const length = syllables.length;
      
      // Replace the range with the subRec word
      // console.log("B4:", length, updated)
      updated.splice(index, length, unRec);
    }
    
    return updated;
  }

  const mergeSyllables = (
    subRecs: Map<string, string[]>,
    targetWords: string[],
    lastChunk: string[]
  ): string[] => {
    const findOrderedGroups = (unRec: string, syllables: string[], lastChunk: string[]): Group[] => {
      const groups: Group[] = []
      let prevSyllableIdx = 0
      let currentGroup: Group | null = null
      
      lastChunk.concat(["<>"]).forEach((l, i) => { // Add end char to push latter group
        const syllableIdx = syllables.indexOf(l, prevSyllableIdx)
        // console.log("SYL:", syllables, syllableIdx, l)
        
        // End group
        if (syllableIdx === -1) {
          // Add to list and reset index
          if (!currentGroup) return
          if (currentGroup.syllables.length === 1) return
          // if (currentGroup.syllables.length === 1 && targetWords.includes(currentGroup.syllables[0])) return
          // console.log("PUSH:", currentGroup)
          groups.push(currentGroup)
          currentGroup = null
          prevSyllableIdx = 0
          return
        }
        
        // Add word to group
        if (!currentGroup) {
          // Create new group
          currentGroup = {
            unRec,
            syllables: [l], // Add new word
            index: i
          } as Group
        } else {
          // Add word to existing group
          currentGroup.syllables.push(l)
        }
        
        return false
      })

      return groups
    }
    
    // Find all groups
    const groups: Group[] = []
    subRecs.entries().forEach(([unRec, syllables]) => {
      groups.push(...findOrderedGroups(unRec, syllables, lastChunk))
    })
    
    // Process groups
    const uniqueGroups: Group[] = []
    const usedIndices: number[] = []
    groups.forEach((g, i) => {
      if (usedIndices.includes(i)) return

      // Combine similar groups
      const done = groups.slice(i + 1).some((s, j) => {
        if (g.index < s.index + s.syllables.length && s.index < g.index + g.syllables.length) { // If any subsequent group has index within the current group range
          // console.log("COMPARE", g.syllables.join(''), s.syllables.join(''))
          
          let gs = g.syllables
          let ss = s.syllables
          if (g.syllables.join('') === s.syllables.join('')) {
            gs = lastChunk.slice(g.index - 1, g.index + g.syllables.length + 1)
            ss = lastChunk.slice(s.index - 1, s.index + s.syllables.length + 1)
          }
          
          if (!usedIndices.includes(j) && levenshtein(g.unRec, gs.join('')) <= levenshtein(s.unRec, ss.join(''))) { // Compare which unRec is closer to the group
            // g is better
            // console.log("g better:", g.unRec, s.unRec)
            usedIndices.push(j) // Eliminate s
          } 
          else {
            // s is better
            // console.log("s better:", g.unRec, s.unRec)
            return true // Eliminate g
          }
        }
        return false
      })
      if (done) return // For eliminating current (g)
      
      uniqueGroups.push(g)
    })
    
    // console.log(uniqueGroups)
    
    const merged = applyUnRecReplacements(lastChunk, uniqueGroups)
    
    return merged
  }
  
  const startTranscription = async () => {
    let socket;
    let lastChunk = ""; // Partial data at the end of the prompt
    let prevChunk = ""; // Previous chunk string that was or is last
    let userContent = "";
    
    if (transcribing) return
    setTranscribing(true)
    console.log("startTranscription")
    alignmentResponse.updateDisplay(subRecsRef.current);
    
    // Initialize elements and socket
    setOutput(<span>...</span>);
    socket = new WebSocket("ws://localhost:5000/ws"); // Open a new WebSocket connection
    socket.binaryType = "arraybuffer"; // Set binary type to handle audio data
    socketRef.current = socket;
    
    // Request: Send target words
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "init", words: alignmentResponse.targetWords }));
    };
    
    // Response: Parse transcription for partial/results
    socket.onmessage = (event) => { // Handle incoming messages from the server
      let update = false;
      const receivedText = JSON.parse(event.data); // Store the received text
      
      // Check for initial response of unrecognized vocabulary
      if (receivedText.type === "unrecognized") {
        subRecsRef.current = jsonToMap(receivedText.subRecs);
        return; 
      }
      
      // Ensure each chunk is positioned correctly in the user prompt
      if (receivedText.type === "result") {
        console.log("B:", subRecsRef.current, alignmentResponse.targetWords, lastChunk.split(' '))
        const l = mergeSyllables(subRecsRef.current as any, alignmentResponse.targetWords, lastChunk.split(' '))
        const nl: string[] = []
        l.forEach((w) => { // REmove words that are not in target
          if (alignmentResponse.targetWords.includes(w))
            nl.push(w)
        });
        console.log("L:", l)
        console.log("NL:", nl)
        userContent += " " + nl.join(' '); // Append the last chunk to the user content
        lastChunk = "";
      } else if (receivedText.data.trim()) { // && receivedText.type === "partial"
        update = lastChunk != prevChunk // Update later only if the chunk has changed
        prevChunk = lastChunk;
        lastChunk = receivedText.data//(update) // Store the last chunk of text
          //mergeSyllables(subRecsRef.current as any, alignmentResponse.targetWords, receivedText.data.split('')).join('') // New data: check for unrecs
          // : ; // Old data
      }
      
      // Update transcription
      if (update) {
        alignmentResponse.updateDisplay(subRecsRef.current);
      }
      
      // Update the user prompt with the current content
      setOutput(
        <>
          <span className="result">{userContent}</span>
          <span className="partial"> {lastChunk}</span>
        </>
      ); 

      // if (lastChunk !== prevChunk) {
      //   console.log("loop", subRecsRef.current)
      //   prevChunk = lastChunk;
      //   alignmentResponse.updateDisplay(subRecsRef.current);
      // }
    };
    
    // Stream audio
    const audioContext = new AudioContext({ sampleRate: 16000 });
    await audioContext.audioWorklet.addModule('worklet.js'); // Load the AudioWorklet module
    audioContextRef.current = audioContext;
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Request microphone access
    const source = audioContext.createMediaStreamSource(stream); // Create a MediaStreamSource from the audio stream
    audioStreamRef.current = stream;
    
    const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor'); // Create an AudioWorkletNode to process the audio data
    workletNodeRef.current = workletNode;
    
    workletNode.port.onmessage = (event) => { // Handle messages from the AudioWorklet
      if (socket.readyState === WebSocket.OPEN) { // Check if the WebSocket is open
        socket.send(event.data); // Send the audio data to the server
      }
    };
    
    source.connect(workletNode).connect(audioContext.destination);
  }

  const stopTranscription = () => {
    // Stop transcribing
    setTranscribing(false);
    
    // Close WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // Disconnect and remove the worklet node
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    // Stop all audio tracks from the stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    // Close the audio context if it’s running
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Optional: Clear UI or output
    // setOutput(<span><i>Stopped.</i></span>);
  };
  
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

  const clearUserPrompt = () => {
    stopTranscription();
    setOutput(<span></span>);
    alignmentResponse.updateDisplay(subRecsRef.current);
    // subRecsRef.current = new Map()
    // console.log(mergeSyllables(subRecsRef.current as any, alignmentResponse.targetWords, ["unclean", "ness"]))//, "l"
    //["corn", "fil", "thin", "fil", "thi", "ness", "par", "akers", "and", "gentiles"]
  }
  
  // useEffect(() => {
  //   alignmentResponse.updateDisplay(subRecs)
  // }, [subRecs]);

  useEffect(() => {
    console.log("load")
    setAlignmentResponse(initAlignment(targetContent) as unknown as alignmentResponseDto);
  }, [])
  
  useEffect(updateCursorIcon, [output])

  // useEffect(() => {
  //   const b = document.getElementById("next-button")
  //   if (!b) return 
  //   b.onclick = alignmentResponse.showNextWord(subRecs)
  // }, [alignmentResponse]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Speak - {formatReference(reference)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <div className="flex gap-2">
            <Button className="py-2 border bg-white" onClick={startTranscription}>Start</Button>
            <Button className="py-2 border bg-white" onClick={stopTranscription}>Stop</Button>
            <Button className="py-2 border bg-white" onClick={() => alignmentResponse.showNextWord(subRecsRef.current)}>Next</Button>
            <Button className="py-2 border bg-white" onClick={clearUserPrompt}>Clear</Button>
          </div>

          {/* User prompt */}
          <div
            id="user-prompt" 
            className="relative flex border-solid rounded min-h-20 m-3 py-3 pr-3 w-auto bg-[#44444f]"
            contentEditable
            suppressContentEditableWarning
          >
            <div className="px-3">
              {transcribing ? <Mic color="#ff5959"/> : <MicOff/>}
            </div>
            <p>
              {output}
            </p>
          </div>

          {/* Passage */}
          <p id="target-prompt" hidden>{targetContent}</p>
          <p id="field" className="m-5"></p>
        </div>
      </CardContent>
    </Card>
  )
}
