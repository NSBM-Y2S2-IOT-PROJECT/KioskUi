"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import GlassCard from "@/components/glscard";
import SystemOverview from "@/components/systemStat";
import { Canvas } from "@react-three/fiber";
import Webcam from "react-webcam"; // Import Webcam

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
              initialWidth={10}
              initialHeight={10}
              initialDepth={10}
              follow_mouse={true}
              // auto_rotate={true}
            />
          </Canvas>
        </div>
      </div>

      <div className="absolute flex items-center justify-center h-screen w-screen">
        <div className="bg-transparent backdrop-blur-[20px] rounded-[10px] border border-[rgba(255,255,255,0.18)] p-8 w-[500px] h-[500px] flex flex-col justify-between">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Camera Viewfinder</h1>
            <p className="text-sm opacity-70">This is a Chat History Demo</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span>Skin Color</span>
              {/* Add your skin color selection component here */}
            </div>
            <div className="flex justify-between items-center">
              <span>Skin Texture</span>
              {/* Add your skin texture selection component here */}
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition">
              Back
            </button>
            <button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition">
              Save
            </button>
          </div>

          <div className="mt-8 text-center">
            <button className="bg-green-600 hover:bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              Speak
            </button>
          </div>

          {/* Add Webcam component here */}
          <Webcam
            audio={false}
            height={200}
            width={200}
            screenshotFormat="image/jpeg"
            style={{ borderRadius: "10px" }}
          />
        </div>
      </div>

      <SystemOverview />
    </>
  );
}
