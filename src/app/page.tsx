"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import GlassCard from "@/components/glscard";
import SystemOverview from "@/components/systemStat";
import { Canvas } from "@react-three/fiber";
import CameraCard from "@/components/maincard";

export default function Home() {
  const [signalCompleted, setSignalCompleted] = useState(false);
  const [showCameraCard, setShowCameraCard] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const ThreeCard = dynamic(() => import("../components/ThreeCard"), {
    ssr: false,
  });

  const handleSignalComplete = () => {
    setIsFading(true); // Trigger fade-out effect
    setTimeout(() => {
      setSignalCompleted(true); // After fade-out, show the new card
      setIsFading(false); // Reset fading state
    }, 500); // Duration should match the fade-out duration
  };

  const handleGoToNextInterface = () => {
    setIsFading(true); // Trigger fade-out effect for transition
    setTimeout(() => {
      setShowCameraCard(true); // Show CameraCard after fading out
    }, 500);
  };

  return (
    <>
      <div
        style={{
          position: "relative",
        }}
      >
        <img
          src="/nav.svg" // Assuming 'nav.svg' is in the public folder
          alt="Navigation Icon"
          style={{
            position: "absolute",
            top: "-50px",
            left: "0",
            width: "auto",
            height: "250px",
          }}
        />
      </div>

      <div className="absolute w-screen h-screen overflow-hidden">
        <div className="absolute inset-0">
          <Canvas>
            <ThreeCard
              initialWidth={2}
              initialHeight={2}
              initialDepth={2}
              follow_mouse={true}
              // auto_rotate={true}
            />
          </Canvas>
        </div>
      </div>

      <SystemOverview />

      <div className="flex items-center justify-center h-screen">
        {!signalCompleted ? (
          <div
            className={`transition-opacity duration-500 ${isFading ? "opacity-0" : "opacity-100"}`}
            style={{
              transition: "opacity 0.5s ease-out",
            }}
          >
            <GlassCard
              heading="- Welcome ! -"
              description={
                <>
                  This is the VISUM Interactive Kiosk System. We will help you
                  with all of your skincare needs...
                </>
              }
              textSize="text-[50pt]"
              textSize2="text-[20pt]"
              boxWidth="w-[600px]"
              boxHeight="h-[500px]"
              tilt={true}
              centerText={true}
              showButton={true}
              buttonText="Let's Get Started !"
              onButtonClick={handleSignalComplete}
            />
          </div>
        ) : !showCameraCard ? (
          <div
            className={`transition-opacity duration-500 ${isFading ? "opacity-0" : "opacity-100"}`}
            style={{
              transition: "opacity 0.5s ease-out",
            }}
          >
            <GlassCard
              heading="- How to Use -"
              description={
                <>
                  1. This is a gesture-based system; use your hands to control.{" "}
                  <br />
                  2. Capture an image of your face in the next interface; we
                  will analyze it and give you recommendations. <br />
                  3. You can also use our Virtual Assistant. <br />
                </>
              }
              textSize="text-[50pt]"
              textSize2="text-[20pt]"
              boxWidth="w-[600px]"
              boxHeight="h-[550px]"
              tilt={true}
              centerText={true}
              buttonText="Go to next interface..."
              showButton={true}
              onButtonClick={handleGoToNextInterface}
            />
          </div>
        ) : (
          <div
            className={`transition-opacity duration-500 ${isFading ? "opacity-0" : "opacity-100"}`}
            style={{
              transition: "opacity 0.5s ease-out",
            }}
          >
            <CameraCard />
          </div>
        )}
      </div>
    </>
  );
}
