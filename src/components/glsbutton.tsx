"use client";
import React, { useState, useRef } from "react";
import { Instrument_Serif } from "next/font/google";
import { Instrument_Sans } from "next/font/google";

const instrumentSerif = Instrument_Serif({ weight: "400" });
const instrumentSans = Instrument_Sans({ weight: "400" });

export default function Glsbutton({ onClick, text }) {
  const [hovering, setHovering] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const handleMouseEnter = () => {
    setHovering(true);
    setProgress(0);

    let start = Date.now();
    intervalRef.current = setInterval(() => {
      let elapsed = Date.now() - start;
      let newProgress = Math.min(elapsed / 3000, 1);
      setProgress(newProgress);
      if (newProgress === 1) {
        clearInterval(intervalRef.current);
        clearTimeout(timerRef.current);
        onClick(); // Trigger click after 3s
      }
    }, 50);

    timerRef.current = setTimeout(() => {
      // fallback in case interval didn't catch it
      setProgress(1);
    }, 3000);
  };

  const handleMouseLeave = () => {
    setHovering(false);
    setProgress(0);
    clearInterval(intervalRef.current);
    clearTimeout(timerRef.current);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block"
    >
      <button
        onClick={onClick}
        className={`px-6 py-2 backdrop-blur-md bg-white/10 text-white border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300 ${instrumentSerif.className} text-[20pt] font-bold relative overflow-hidden`}
      >
        {text}
        {hovering && (
          <div
            className="absolute inset-0 bg-white/30 pointer-events-none"
            style={{
              transform: `scaleX(${progress})`,
              transformOrigin: "left",
              transition: "transform 50ms linear",
              mixBlendMode: "overlay",
            }}
          />
        )}
      </button>
    </div>
  );
}
