import { preconnect } from "react-dom";
import { updatePassage } from "./alignment copy";
import { Group, store, Token } from "./store";

export const jsonToMap = (obj: string): Map<string, any> => {
  // const obj = JSON.parse(jsonStr);
  return new Map(Object.entries(obj));
}

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

export const applyUnRecReplacements = (lastChunk: string[], groups: Group[]): string[] => {
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

export const mergeSyllables = (
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

const sendCurrentUnrecognized = (prevUnrecognized: string[], onChange: any = () => 0) => {
  if (JSON.stringify(store.currentUnrecognized) !== JSON.stringify(prevUnrecognized)) { // Words have changed
    console.log("CH:", store.currentUnrecognized, prevUnrecognized)
    onChange()
    if (store.socket && store.socket.readyState === WebSocket.OPEN) { // Socket is available
      store.socket.send(JSON.stringify({
        type: "update_vocab",
        words: store.currentUnrecognized
      }));
    }
    console.log("NEW VOCAB:", store.currentUnrecognized)
  }
}

export const startTranscription = async (
  setPassage: any, 
  setOutput: any, 
  setCursorIdx: any, 
  setTranscribing: any
) => {
  if (store.transcribing) return
  
  setOutput(<span>...</span>);
  setTimeout(() => {
    store.transcribing = true;
    setTranscribing(true);
  }, 800)
  // console.log("startTranscription")
  
  let lastChunk = ""; // Partial data at the end of the prompt
  let prevChunk = ""; // Previous chunk string that was or is last
  let userContent = "";
  // console.log("B")
  // setPassage((p: any) => updatePassage([], setCursorIdx, p))
  setPassage(() => updatePassage([], setCursorIdx))
  
  // Initialize elements and socket
  const socket = new WebSocket("ws://localhost:5000/ws"); // Open a new WebSocket connection
  socket.binaryType = "arraybuffer"; // Set binary type to handle audio data
  store.socket = socket;
  
  // Request: Send target words
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "init", words: store.targetWords }));
  };
  
  // Response: Parse transcription for partial/results
  socket.onmessage = (event) => { // Handle incoming messages from the server
    let update = false;
    const receivedText = JSON.parse(event.data); // Store the received text
    const prevUnrecognized = [...store.currentUnrecognized] // Copy
    // Check for initial response of unrecognized vocabulary
    if (receivedText.type === "unrecognized") { // Initial response
      // console.log("SR:", receivedText.subRecs)
      console.log("RECEIVED:",receivedText.subRecs)
      store.subRecs = jsonToMap(receivedText.subRecs);
      return; 
    } else if (receivedText.type === "result") {
      // console.log("B:", store.subRecs, store.targetWords, lastChunk.split(' '))
      // const l = mergeSyllables(store.subRecs as any, store.targetWords, lastChunk.split(' '))
      // const nl: string[] = []
      // l.forEach((w) => { // REmove words that are not in target
      //   if (store.targetWords.includes(w))
      //     nl.push(w)
      // });
      // console.log("L:", l)
      // console.log("NL:", nl)
      
      // Ensure each chunk is positioned correctly in the user prompt
      userContent += " " + lastChunk//nl.join(' '); // Append the last chunk to the user content
      const userWords = [...store.lastUserWordsChunk, ...lastChunk.split(" ")].filter((s) => s !== "")
      console.log("C:", store.currentUnrecognized)
      setPassage(() => {
        const passage = updatePassage(userWords, setCursorIdx, false);
        console.log("SENDING RESULT")
        sendCurrentUnrecognized(prevUnrecognized) // Update vocabulary 
        console.log("SENT RESULT")
        return passage
      }) // Update as result  lastChunk !== ""
      lastChunk = "";
    
    } else if (receivedText.type === "partial" && receivedText.data.trim()) {
      update = lastChunk != prevChunk // Update later only if the chunk has changed
      prevChunk = lastChunk;
      lastChunk = receivedText.data//(update) // Store the last chunk of text
        //mergeSyllables(subRecsRef.current as any, alignmentResponse.targetWords, receivedText.data.split('')).join('') // New data: check for unrecs
        // : ; // Old data
    }
    
    // Update transcription
    if (update) {
      // console.log("A")
      const userWords = [...store.lastUserWordsChunk, ...lastChunk.split(" ")].filter((s) => s !== "")
      // setPassage((p: any) => updatePassage(userWords, setCursorIdx, p, false))
      // console.log("UW:", userWords, lastChunk)
      console.log("C:", store.currentUnrecognized)
      setPassage(() => {
        const passage = updatePassage(userWords, setCursorIdx)
        console.log("F:", store.currentUnrecognized, prevUnrecognized)
        sendCurrentUnrecognized(prevUnrecognized, () => {
          userContent += " " + lastChunk;
          lastChunk = ""
        }) // Update vocabulary 
        // if (JSON.stringify(store.currentUnrecognized) !== JSON.stringify(prevUnrecognized)) { // Words have changed
        
        return passage
      }) // Update as partial  lastChunk !== ""
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
  store.audioContext = audioContext;
  
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Request microphone access
  const source = audioContext.createMediaStreamSource(stream); // Create a MediaStreamSource from the audio stream
  store.audioStream = stream;
  
  const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor'); // Create an AudioWorkletNode to process the audio data
  store.workletNode = workletNode;
  
  workletNode.port.onmessage = (event) => { // Handle messages from the AudioWorklet
    if (socket.readyState === WebSocket.OPEN) { // Check if the WebSocket is open
      socket.send(event.data); // Send the audio data to the server
    }
  };
  
  source.connect(workletNode).connect(audioContext.destination);
}

export const stopTranscription = (setTranscribing: any) => {
  // Stop transcribing
  store.transcribing = false
  setTranscribing(false)
  
  // Close WebSocket
  if (store.socket && store.socket.readyState === WebSocket.OPEN) {
    store.socket.close();
    store.socket = null;
  }
  
  // Disconnect and remove the worklet node
  if (store.workletNode) {
    store.workletNode.disconnect();
    store.workletNode = null;
  }
  
  // Stop all audio tracks from the stream
  if (store.audioStream) {
    store.audioStream.getTracks().forEach((track) => track.stop());
    store.audioStream = null;
  }

  // Close the audio context if it’s running
  if (store.audioContext && store.audioContext.state !== "closed") {
    store.audioContext.close();
    store.audioContext = null;
  }
  
  // Optional: Clear UI or output
  // setOutput(<span><i>Stopped.</i></span>);
};