"use client";
import { useRef } from "react";
import { Instrument_Serif } from "next/font/google";
import Glsbutton from "@/components/glsbutton";

const instrumentSerif = Instrument_Serif({ weight: "400" });
const instrumentSerifBold = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

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
}) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!tilt) return; // Skip tilt logic if tilt is false

    const card = cardRef.current;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * 30;
    const y = ((e.clientY - top) / height - 0.5) * -30;
    card.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
  };

  const handleMouseLeave = () => {
    if (!tilt) return; // Skip resetting the transform if tilt is false
    cardRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`bg-transparent backdrop-blur-[20px] rounded-[10px] border border-[rgba(255,255,255,0.18)] p-8 ${boxWidth} ${boxHeight} transition-transform duration-300 ease-out`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <h2
        className={`text-white ${textSize} font-bold mb-4 ${instrumentSerif.className}`}
      >
        {heading}
      </h2>
      <p
        className={`text-white ${instrumentSerif.className} ${textSize2} ${centerText ? "text-center" : ""}`}
      >
        {description}
      </p>

      {/* Conditionally render the button */}
      {showButton && (
        <div className="flex items-center justify-center p-20 bottom-0">
          <Glsbutton
            text={buttonText || "Lets Get Started"} // Use buttonText or fallback to default text
            onClick={() => {
              console.log("Button clicked!");
              onButtonClick("Custom Argument"); // Pass any argument to the function
            }}
          />
        </div>
      )}
    </div>
  );
}
