import { BibleReference } from "@/types/bible";
import { create } from "zustand";

export interface Group {
  unRec: string;
  syllables: string[];
  index: number;
}

export type State = "C" | "I" | "M" | "O" | null // Correct, Incorrect, Match, Override

export interface Token {
  display: string,
  word: string,
  separator: string,
  order: boolean,
  temp: boolean,
  state: State
}

export interface Cursor {
  i: number, 
  j: number
}


interface zStore { // Zustand state type
  // REACTIVE
  passage: Token[][];
  output: React.JSX.Element;
  cursorIdx: Cursor;
  transcribing: boolean;
  
  setPassage: (n: Token[][]) => void;
  setOutput: (n: React.JSX.Element) => void;
  setCursorIdx: (n: Cursor) => void;
  setTranscribing: (n: boolean) => void;
}

interface eStore { // Ephemeral state type
  // NON-REACTIVE
  // Alignment
  passageBuffer: Token[][],
  targetWords: string[],
  userContent: string,
  // userWords: [] as string[],
  // userWordMatches: [] as number[][],
  
  subRecs: Map<string, any>,
  currentUnrecognized: string[],
  lastUserWordsChunk: string[],
  
  // Audio Client
  socket: WebSocket | null,
  workletNode: AudioWorkletNode | null,
  audioContext: AudioContext | null,
  audioStream: MediaStream | null,
}

export const useStore = create<zStore>((set, get) => ({
  // REACTIVE
  passage: [],
  output: <span></span>,
  cursorIdx: { i: 0, j: 0 },
  transcribing: false,
  
  setPassage: (n: Token[][]) => set({ passage: n }),
  setOutput: (n: React.JSX.Element) => set({ output: n }),
  setCursorIdx: (n: Cursor) => set({ cursorIdx: n }),
  setTranscribing: (n: boolean) => set({ transcribing: n }),
}));
/*
export const store: eStore = {
  // NON-REACTIVE
  // Alignment
  passageBuffer: [] as Token[][],
  targetWords: [] as string[],
  // userWords: [] as string[],
  // userWordMatches: [] as number[][],
  
  subRecs: new Map() as Map<string, any>,
  currentUnrecognized: [] as string[],
  lastUserWordsChunk: [] as string[],
  lastUserWordsChunkLastWordIdx: 0 as number,
  
  // Audio Client
  socket: null as WebSocket | null,
  workletNode: null as AudioWorkletNode | null,
  audioContext: null as AudioContext | null,
  audioStream: null as MediaStream | null,
}

/*/
export const store = {
  // Alignment
  passageBuffer: [],
  targetWords: [],
  userContent: "",
  // userWords: [] as string[],
  // userWordMatches: [] as number[][],
  
  subRecs: new Map(),
  currentUnrecognized: [],
  lastUserWordsChunk: [],
  cursorIdx: { i: 0, j: 0 },
  
  // Audio Client
  transcribing: false,
  socket: null,
  workletNode: null,
  audioContext: null,
  audioStream: null,
} as eStore
//*/