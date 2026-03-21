"use client";

import { useState, useEffect } from "react";

interface TypeWriterProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function TypeWriter({ text, speed = 50, delay = 300, className, style }: TypeWriterProps) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;

    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);

    return () => clearTimeout(timer);
  }, [started, displayed, text, speed]);

  return (
    <span className={className} style={style}>
      {displayed}
      {displayed.length < text.length && <span className="animate-pulse">|</span>}
    </span>
  );
}
