"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import GlassCard from "@/components/glscard";
import SystemOverview from "@/components/systemStat";
import { Canvas } from "@react-three/fiber";
import Webcam from "react-webcam"; // Import Webcam
import { Handlee, Instrument_Serif } from "next/font/google";
import Glsbutton from "@/components/glsbutton";

const instrumentSerif = Instrument_Serif({ weight: "400" });

export default function Home() {
  const [signalCompleted, setSignalCompleted] = useState(false);
  const [showCameraCard, setShowCameraCard] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const ThreeCard = dynamic(() => import("../../components/ThreeCard"), {
    ssr: false,
  });

  const handleBack = () => {
    window.location.href = "/";
  };

  const handleSave = () => {
    // Implement save functionality here
    console.log("Save button clicked");
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

      <div className="flex flex-row">
        <div
          className={`flex items-center justify-center h-screen w-screen ${instrumentSerif.className}`}
        >
          <div className="bg-transparent backdrop-blur-[20px] rounded-[10px] border border-[rgba(255,255,255,0.18)] p-8 w-[500px] h-[500px] flex flex-col justify-between relative">
            This card should appear after a scan is done, this ui should show
            some recommendations when the scan is done. This is here until
            backend is finished. This card should appear smoothly from left for
            recommendations
          </div>
          <div className="bg-transparent backdrop-blur-[20px] rounded-[10px] border border-[rgba(255,255,255,0.18)] p-8 w-[500px] h-[500px] flex flex-col justify-between relative">
            {/* Webcam Viewfinder at the top */}

            <div className="text-center mt-16 p-10">
              <div className="absolute top-0 p-5 left-1/2 transform -translate-x-1/2">
                <Webcam
                  audio={false}
                  height={900}
                  width={800}
                  screenshotFormat="image/jpeg"
                  style={{
                    borderRadius: "5px",
                    border: "0.5px solid white",
                    boxShadow: "0 0 10px rgba(255,255,255,0.3)",
                  }}
                />
              </div>
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
              <div>
                <Glsbutton
                  text="Back"
                  onClick={handleBack}
                  // onSignalComplete={handleSignalComplete}
                />
              </div>
              <div>
                <Glsbutton
                  text="Save"
                  onClick={handleSave}
                  // onSignalComplete={handleSignalComplete}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SystemOverview />
    </>
  );
}
