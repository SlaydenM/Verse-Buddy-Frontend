import React, { useState } from "react";
import { Text, Lightbulb } from "lucide-react";

import "@/styles/flashcard.css"; // for custom 3D transform styles

interface FlashcardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ front, back, isFlipped, onFlip }) => {
  const [flipped, setFlipped] = useState<boolean>(isFlipped);
  
  return (
    <div className="perspective w-full aspect-[5/3] m-auto" onClick={() => {setFlipped(!flipped); onFlip()}}>
      <div className={`card relative w-full h-full select-none ${flipped ? "rotate-x-180" : ""}`}>
        <div className="card-face front absolute w-full h-full p-8 backface-hidden bg-[#c2c5ff] text-black rounded-xl shadow-md flex items-center justify-center text-xl">
          <Text className="absolute top-2 left-2 text-gray-500" size={24} />
          {front}
        </div>
        <div className="card-face back absolute w-full h-full p-8 backface-hidden bg-[#44444f] text-[limegreen] rounded-xl shadow-md transform rotate-x-180 flex items-center justify-center text-xl">
          <Lightbulb className="absolute top-2 left-2 text-gray-400" size={24} />
          {back}
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
