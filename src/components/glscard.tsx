"use client";
import { useRef, ReactNode, MouseEvent } from "react";
import { Instrument_Serif } from "next/font/google";
import Glsbutton from "@/components/glsbutton";

const instrumentSerif = Instrument_Serif({ 
  weight: "400",
  subsets: ["latin", "latin-ext"]
});
const instrumentSerifBold = Instrument_Serif({
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

interface GlassCardProps {
  heading: string;
  description: string;
  textSize?: string;
  textSize2?: string;
  boxWidth?: string;
  boxHeight?: string;
  tilt?: boolean;
  centerText?: boolean;
  buttonText?: string;
  showButton?: boolean;
  onButtonClick?: () => void;
  children?: ReactNode;
}

export default function GlassCard({
  heading,
  description,
  textSize = "text-base",
  textSize2 = "text-base",
  boxWidth = "w-[300px]",
  boxHeight = "h-[200px]",
  tilt = true,
  centerText = false,
  buttonText = "",
  showButton = false,
  onButtonClick = () => {},
  children,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!tilt || !cardRef.current) return; // Skip tilt logic if tilt is false

    const card = cardRef.current;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * 30;
    const y = ((e.clientY - top) / height - 0.5) * -30;
    card.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
  };

  const handleMouseLeave = () => {
    if (!tilt || !cardRef.current) return; // Skip resetting the transform if tilt is false
    cardRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`bg-transparent backdrop-blur-[20px] rounded-[10px] border border-[rgba(255,255,255,0.18)] p-8 ${boxWidth} ${boxHeight} transition-transform duration-300 ease-out flex flex-col items-center justify-between`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <h2
        className={`text-white ${textSize} font-bold mb-4 ${instrumentSerif.className}`}
        style={{
          textShadow: `
            0 0 10px rgba(255, 0, 80, 0.4),
            0 0 20px rgba(255, 0, 80, 0.3),
            0 0 30px rgba(255, 0, 80, 0.2)
          `,
          animation: "glow 1.5s ease-in-out infinite alternate",
        }}
      >
        {heading}
      </h2>
      <p
        className={`text-white ${instrumentSerif.className} ${textSize2} ${centerText ? "text-center" : ""}`}
      >
        {description}
      </p>

      {/* Render children if provided */}
      {children && (
        <div className="w-full mt-6">
          {children}
        </div>
      )}

      {/* Conditionally render the button */}
      {showButton && (
        <div className="flex items-center justify-center p-20 bottom-0">
          <Glsbutton
            text={buttonText || "Lets Get Started"}
            onClick={onButtonClick} // Use the passed onButtonClick function
            onSignalComplete={() => {}}
          />
        </div>
      )}
    </div>
  );
}