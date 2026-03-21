"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import TypeWriter from "./TypeWriter";

interface ChatBubbleProps {
  characterImage: string;
  characterName: string;
  characterVideo?: string | null;
  text: string;
  onComplete?: () => void;
  speed?: number;
}

export default function ChatBubble({ characterImage, characterName, characterVideo, text, onComplete, speed = 40 }: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-start gap-3 mb-4"
    >
      <div className="shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden" style={{ border: "1.5px solid rgba(201,169,110,0.5)", boxShadow: "0 0 12px rgba(201,169,110,0.15)" }}>
          {characterVideo ? (
            <video src={characterVideo} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          ) : (
            <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <Image src={characterImage} alt={characterName} width={80} height={80} className="object-cover w-full h-full" />
            </motion.div>
          )}
        </div>
      </div>
      {/* Dark semi-transparent bubble — NO backdrop-blur (verified: readability risk with moving Aurora) */}
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
        style={{
          background: "rgba(15, 20, 40, 0.85)",
          border: "1px solid rgba(201,169,110,0.15)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <p className="text-sm text-white/90 leading-relaxed">
          <TypeWriter text={text} speed={speed} delay={200} onComplete={onComplete} />
        </p>
      </div>
    </motion.div>
  );
}
