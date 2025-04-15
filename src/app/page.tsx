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

  const ThreeCard = dynamic(() => import("../components/ThreeCard"), {
    ssr: false,
  });

  const handleClick = () => {
    window.location.href = "/scanner";
  };

  const handleSignalComplete = () => {
    setIsFading(true); // Trigger fade-out effect
    setTimeout(() => {
      setSignalCompleted(true); // After fade-out, show the new card
      setIsFading(false); // Reset fading state
    }, 500); // Duration should match the fade-out duration
  };

  return (
    <>
      <style jsx global>{`
        html,
        body {
          overflow: hidden;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }

        body::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>

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
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(255,0,80,0.4), transparent 60%)",
                filter: "blur(80px)",
                animation: "pulse 5s ease-in-out infinite",
              }}
            />
          </div>

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
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,0,80,0.4), transparent 70%)",
            filter: "blur(80px)",
            animation: "pulse 8s ease-in-out infinite",
          }}
        />
      </div>

      <SystemOverview />

      <div className="flex items-center justify-center h-screen px-4">
        {!signalCompleted ? (
          <div
            className={`transition-opacity duration-500 ${isFading ? "opacity-0" : "opacity-100"}`}
            style={{
              transition: "opacity 0.5s ease-out",
            }}
          >
            <GlassCard
              heading="Welcome !"
              description={
                <>
                  Introducing VISUM, your Interactive Kiosk System designed to
                  elevate your skincare journey. Let us guide you with
                  personalized solutions for all your skincare needs.
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
              heading="How to Use"
              description={
                <>
                  1. Enjoy a seamless gesture-based experience—simply use your
                  hands to navigate. <br />
                  2. Snap a photo of your face on the next screen, and we'll
                  analyze it to provide tailored skincare recommendations.{" "}
                  <br />
                  3. Connect with our Virtual Assistant for personalized
                  guidance. <br />
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
              onButtonClick={handleClick}
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
