import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

export default function LiveTranscription() {
  const [output, setOutput] = useState('...');
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const targetPrompt = `In approximate string matching, the objective is to find matches for short strings in many longer texts, in situations where a small number of differences is to be expected. The short strings could come from a dictionary, for instance. Here, one of the strings is typically short, while the other is arbitrarily long. This has a wide range of applications, for instance, spell checkers, correction systems for optical character recognition, and software to assist natural-language translation based on translation memory.`;
  
  const startTranscription = async () => {
    setOutput('Listening...');
    
    const socket = new WebSocket('ws://localhost:5000/ws');
    socket.binaryType = 'arraybuffer';
    socketRef.current = socket;
    
    socket.onopen = () => {
      const initWords = targetPrompt
        .toLowerCase()
        .match(/\b[a-z']+\b/g)
        ?.filter((v, i, a) => a.indexOf(v) === i) || [];
      socket.send(JSON.stringify({ type: 'init', words: initWords }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'result') {
        setOutput(`Recognized: ${data.data}`);
      } else if (data.type === 'partial') {
        setOutput(`Partial: ${data.data}`);
      }
    };

    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;
    await audioContext.audioWorklet.addModule('/worklet.js');

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');

    workletNode.port.onmessage = (e) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(e.data);
      }
    };

    source.connect(workletNode).connect(audioContext.destination);
  };
  
  return (
    <div>
      <Button onClick={startTranscription}>Start</Button>
      <p>{output}</p>
      <p
        id="user-prompt"
        contentEditable
        suppressContentEditableWarning
        style={{ border: '1px solid #ccc', padding: '0.5em' }}
      >
        the objective is to not find matches for short
      </p>
      <p id="target-prompt" hidden>{targetPrompt}</p>
      <p id="field"></p>
      <p id="field-2"></p>
    </div>
  );
}
