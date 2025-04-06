"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import GlassCard from "@/components/glscard";
import SystemOverview from "@/components/systemStat";
import { Canvas } from "@react-three/fiber";

export default function Home() {
  const [signalCompleted, setSignalCompleted] = useState(false);
  const [showCameraCard, setShowCameraCard] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const ThreeCard = dynamic(() => import("../../components/ThreeCard"), {
    ssr: false,
  });

  const handleSignalComplete = () => {
    setIsFading(true); // Trigger fade-out effect
    setTimeout(() => {
      setSignalCompleted(true); // After fade-out, show the new card
      setIsFading(false); // Reset fading state
    }, 500); // Duration should match the fade-out duration
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
    </>
  );
}
